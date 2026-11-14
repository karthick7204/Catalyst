import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getAuthenticatedCloneUrl } from '../github/auth.js';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class WorkspaceSandbox {
  public readonly jobId: string;
  public readonly workspacePath: string;
  public readonly repoFullName: string;
  public readonly fixBranch: string;
  public baseBranch: string = 'main';

  constructor(jobId: string, repoFullName: string, issueIdentifier: string) {
    this.jobId = jobId;
    this.repoFullName = repoFullName;
    this.fixBranch = `catalyst/fix-${issueIdentifier.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    this.workspacePath = path.join(config.SANDBOX_WORKSPACES_ROOT, jobId);
  }

  /**
   * Initializes workspace, clones the repo, and creates a fix branch
   */
  async initialize(): Promise<void> {
    logger.info({ jobId: this.jobId, repo: this.repoFullName }, 'Initializing workspace sandbox');

    // Ensure clean workspace directory
    await fs.rm(this.workspacePath, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(this.workspacePath, { recursive: true });

    // Authenticated clone
    const cloneUrl = await getAuthenticatedCloneUrl(this.repoFullName);
    logger.info({ workspacePath: this.workspacePath }, 'Cloning target repository');

    await execAsync(`git clone --depth 50 ${cloneUrl} .`, {
      cwd: this.workspacePath,
      timeout: 120000
    });

    // Detect default branch
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.workspacePath
      });
      this.baseBranch = stdout.trim() || 'main';
    } catch {
      this.baseBranch = 'main';
    }

    // Configure local git author in workspace
    await execAsync('git config user.name "Catalyst AI Agent"', { cwd: this.workspacePath });
    await execAsync('git config user.email "catalyst-agent@users.noreply.github.com"', {
      cwd: this.workspacePath
    });

    // Checkout dedicated fix branch
    await execAsync(`git checkout -b ${this.fixBranch}`, { cwd: this.workspacePath });
    logger.info({ fixBranch: this.fixBranch }, 'Checked out fix branch in sandbox');
  }

  /**
   * Safely execute shell command inside the workspace directory
   */
  async execCommand(command: string, timeoutMs: number = 60000): Promise<CommandResult> {
    logger.debug({ command, cwd: this.workspacePath }, 'Executing sandbox command');

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workspacePath,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          CI: 'true',
          NODE_ENV: 'test'
        }
      });
      return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: (err.stdout || '').trim(),
        stderr: (err.stderr || err.message || '').trim(),
        exitCode: typeof err.code === 'number' ? err.code : 1
      };
    }
  }

  /**
   * Resolve and validate path within sandbox to prevent directory traversal
   */
  resolvePath(relativePath: string): string {
    const fullPath = path.resolve(this.workspacePath, relativePath);
    if (!fullPath.startsWith(this.workspacePath)) {
      throw new Error(`Security Violation: Path "${relativePath}" escapes sandbox boundary`);
    }
    return fullPath;
  }

  /**
   * Get git diff of current changes
   */
  async getGitDiff(): Promise<string> {
    try {
      const { stdout } = await execAsync('git diff HEAD', { cwd: this.workspacePath });
      if (!stdout.trim()) {
        // Also check for untracked files
        const status = await execAsync('git status --porcelain', { cwd: this.workspacePath });
        return status.stdout.trim() ? 'Untracked files present:\n' + status.stdout : 'No changes detected.';
      }
      return stdout;
    } catch (err: any) {
      return `Failed to compute diff: ${err.message}`;
    }
  }

  /**
   * Commit all modified and new files to the branch
   */
  async commitChanges(commitMessage: string): Promise<void> {
    await execAsync('git add -A', { cwd: this.workspacePath });
    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: this.workspacePath
    });
  }

  /**
   * Push the fix branch to the remote repository
   */
  async pushBranch(): Promise<void> {
    logger.info({ branch: this.fixBranch }, 'Pushing branch to remote');
    await execAsync(`git push origin ${this.fixBranch}`, { cwd: this.workspacePath });
  }

  /**
   * Cleans up the temporary sandbox directory
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.workspacePath, { recursive: true, force: true });
      logger.info({ workspacePath: this.workspacePath }, 'Workspace cleaned up');
    } catch (err) {
      logger.warn({ err, workspacePath: this.workspacePath }, 'Failed to cleanup workspace');
    }
  }
}

