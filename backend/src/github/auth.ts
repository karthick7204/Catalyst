import { createAppAuth } from '@octokit/auth-app';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface GitHubAuthCredentials {
  token: string;
  authHeader: string;
}

function isRealToken(token?: string): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  return trimmed.length > 10 && !trimmed.includes('your_github_token_here') && !trimmed.includes('placeholder');
}

/**
 * Mint a scoped token for GitHub operations (GitHub App Installation token or PAT)
 */
export async function getGitHubAuthToken(): Promise<string> {
  // If GitHub App credentials are provided, generate a scoped installation token
  if (config.GITHUB_APP_ID && config.GITHUB_APP_PRIVATE_KEY && config.GITHUB_APP_INSTALLATION_ID) {
    try {
      const auth = createAppAuth({
        appId: config.GITHUB_APP_ID,
        privateKey: config.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
        installationId: config.GITHUB_APP_INSTALLATION_ID
      });

      const installationAuthentication = await auth({ type: 'installation' });
      return installationAuthentication.token;
    } catch (err) {
      logger.error({ err }, 'Failed to authenticate via GitHub App, checking for fallback token');
    }
  }

  // Fallback to PAT if provided and not placeholder
  if (isRealToken(config.GITHUB_TOKEN)) {
    return config.GITHUB_TOKEN!.trim();
  }

  throw new Error('No valid GitHub credentials found. Provide GITHUB_APP_* credentials or a valid GITHUB_TOKEN');
}

/**
 * Returns an authenticated Git remote URL for cloning and pushing
 */
export async function getAuthenticatedCloneUrl(repoFullName: string): Promise<string> {
  // If it's a local repository path, clone directly from local disk
  if (repoFullName.startsWith('/') || repoFullName.startsWith('./') || repoFullName.startsWith('file://')) {
    return repoFullName.replace(/^file:\/\//, '');
  }

  try {
    const token = await getGitHubAuthToken();
    return `https://x-access-token:${token}@github.com/${repoFullName}.git`;
  } catch {
    // If no auth token is available, attempt cloning as a public repo
    logger.info({ repo: repoFullName }, 'Cloning via public HTTPS (no valid GitHub token provided)');
    return `https://github.com/${repoFullName}.git`;
  }
}
