import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface AppConfig {
  port: number;
  linearWebhookSecret: string;
  triggerLabel: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    url?: string;
  };
  githubToken: string;
  defaultGithubRepoUrl?: string;
  scratchDir: string;
  docker: {
    socketPath?: string;
    host?: string;
    port?: number;
    image: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  linearWebhookSecret: process.env.LINEAR_WEBHOOK_SECRET || '',
  triggerLabel: (process.env.TRIGGER_LABEL || 'ai-fix').toLowerCase(),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || undefined,
  },
  githubToken: process.env.GITHUB_TOKEN || '',
  defaultGithubRepoUrl: process.env.DEFAULT_GITHUB_REPO_URL || undefined,
  scratchDir: path.resolve(process.env.SCRATCH_DIR || '/tmp/catalyst-workspaces'),
  docker: {
    socketPath: process.env.DOCKER_SOCKET_PATH || (process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'),
    host: process.env.DOCKER_HOST || undefined,
    port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT, 10) : undefined,
    image: process.env.DOCKER_SANDBOX_IMAGE || 'alpine/git:latest',
  },
};
