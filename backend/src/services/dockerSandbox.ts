import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import { config } from '../config/env.js';
import { RepoProvisioningJobData, RepoProvisioningJobResult } from '../types/job.js';

export class DockerSandboxService {
  private docker: Docker;

  constructor() {
    if (config.docker.host) {
      this.docker = new Docker({
        host: config.docker.host,
        port: config.docker.port || 2375,
      });
    } else {
      this.docker = new Docker({
        socketPath: config.docker.socketPath,
      });
    }
  }

  /**
   * Ensures the required Docker image is available locally.
   */
  private async ensureImage(image: string): Promise<void> {
    const images = await this.docker.listImages();
    const exists = images.some((img) =>
      img.RepoTags?.some((tag) => tag === image || tag.startsWith(`${image}:`))
    );

    if (exists) {
      return;
    }

    console.log(`[DockerSandbox] Pulling image: ${image}...`);
    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) return reject(err);
        this.docker.modem.followProgress(stream, (pullErr: Error | null) => {
          if (pullErr) return reject(pullErr);
          resolve();
        });
      });
    });
  }

  /**
   * Spins up an ephemeral container to clone the repo and checkout the fix branch.
   */
  public async provisionSandbox(
    jobData: RepoProvisioningJobData
  ): Promise<RepoProvisioningJobResult> {
    const { issueIdentifier, repoUrl, branchName, scratchWorkspacePath } = jobData;
    const image = config.docker.image;

    // Ensure host scratch workspace directory exists and is prepared
    if (!fs.existsSync(scratchWorkspacePath)) {
      fs.mkdirSync(scratchWorkspacePath, { recursive: true });
    }

    await this.ensureImage(image);

    console.log(
      `[DockerSandbox] Starting provisioning container for ${issueIdentifier} (mount: ${scratchWorkspacePath} -> /workspace)`
    );

    // Sandbox script executed securely inside container:
    // 1. Constructs auth clone URL purely in container memory from $GITHUB_TOKEN env var.
    // 2. Clones the target repo into /workspace.
    // 3. Immediately sanitizes remote.origin.url to public HTTPS so token is NEVER written to .git/config on disk.
    // 4. Creates and checks out fix/<issue-identifier> branch.
    const containerScript = `
      set -eo pipefail

      echo "[SANDBOX] Preparing workspace directory..."
      # Clean workspace if any residual data existed
      rm -rf /workspace/* /workspace/.[!.]* 2>/dev/null || true

      # Construct memory-only authenticated clone URL
      AUTH_URL=$(echo "\$REPO_URL" | sed -E "s#https://(github\\.com/.*)#https://x-access-token:\${GITHUB_TOKEN}@\\1#")

      echo "[SANDBOX] Executing shallow git clone: \${REPO_URL} into /workspace..."
      git clone --depth 1 "\$AUTH_URL" /workspace

      cd /workspace

      # Critical: Reset origin URL to clean repo URL without token to avoid persisting token in /workspace/.git/config
      git remote set-url origin "\$REPO_URL"

      echo "[SANDBOX] Checking out target branch: \${BRANCH_NAME}..."
      git checkout -b "\${BRANCH_NAME}"

      echo "[SANDBOX] Repository successfully provisioned and ready for MCP agents."
    `;

    const container = await this.docker.createContainer({
      Image: image,
      Cmd: ['sh', '-c', containerScript],
      Env: [
        `GITHUB_TOKEN=${config.githubToken}`,
        `REPO_URL=${repoUrl}`,
        `BRANCH_NAME=${branchName}`,
        `ISSUE_IDENTIFIER=${issueIdentifier}`,
      ],
      HostConfig: {
        Binds: [`${scratchWorkspacePath}:/workspace:rw`],
        AutoRemove: false, // Cleaned up in finally block after collecting logs
      },
      WorkingDir: '/workspace',
    });

    let stdoutLogs = '';
    let stderrLogs = '';

    const logStream = new Writable({
      write(chunk, _encoding, callback) {
        const text = chunk.toString();
        stdoutLogs += text;
        callback();
      },
    });

    try {
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      // Demux stdout/stderr to protect against token leaks in logs
      container.modem.demuxStream(
        stream,
        logStream,
        new Writable({
          write(chunk, _encoding, callback) {
            const text = chunk.toString();
            stderrLogs += text;
            callback();
          },
        })
      );

      await container.start();

      const [statusResult] = await container.wait();
      const exitCode = statusResult.StatusCode;

      // Sanitize logs in case token appeared anywhere
      const sanitizedLogs = (stdoutLogs + '\n' + stderrLogs).replace(
        new RegExp(config.githubToken || '___NO_TOKEN___', 'g'),
        '[REDACTED_TOKEN]'
      );

      if (exitCode !== 0) {
        this.handleFailure(exitCode, sanitizedLogs, repoUrl, branchName);
      }

      console.log(`[DockerSandbox] Container completed with status 0 for ${issueIdentifier}`);

      return {
        issueIdentifier,
        repoUrl,
        branchName,
        scratchWorkspacePath,
        containerId: container.id,
        executionLogs: sanitizedLogs.trim(),
        provisionedAt: new Date().toISOString(),
      };
    } finally {
      // Ephemeral cleanup: unconditionally remove the container
      try {
        await container.remove({ force: true });
        console.log(`[DockerSandbox] Removed ephemeral container ${container.id.substring(0, 12)}`);
      } catch (err) {
        console.warn(`[DockerSandbox] Notice: Could not remove container ${container.id}:`, err);
      }
    }
  }

  /**
   * Categorizes container failure and surfaces actionable error messages.
   */
  private handleFailure(
    exitCode: number,
    logs: string,
    repoUrl: string,
    branchName: string
  ): never {
    const lower = logs.toLowerCase();

    if (lower.includes('repository not found') || lower.includes('could not resolve host') || lower.includes('404')) {
      throw new Error(
        `[ProvisioningFailed:BadUrl] Repository not found or unreachable: ${repoUrl}. Verify URL and repository visibility.\nLogs: ${logs}`
      );
    }

    if (
      lower.includes('authentication failed') ||
      lower.includes('permission denied') ||
      lower.includes('could not read username') ||
      lower.includes('403') ||
      lower.includes('401')
    ) {
      throw new Error(
        `[ProvisioningFailed:Auth] GitHub authentication failed. Verify GITHUB_TOKEN has 'repo' or 'contents:read/write' permissions.\nLogs: ${logs}`
      );
    }

    if (lower.includes('already exists') || lower.includes('not a valid branch name')) {
      throw new Error(
        `[ProvisioningFailed:Branch] Failed to create branch '${branchName}'. Branch may already exist or have invalid characters.\nLogs: ${logs}`
      );
    }

    throw new Error(
      `[ProvisioningFailed:Exit${exitCode}] Ephemeral sandbox execution failed with exit code ${exitCode}.\nLogs: ${logs}`
    );
  }
}

export const dockerSandboxService = new DockerSandboxService();
