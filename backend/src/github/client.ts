import { Octokit } from '@octokit/rest';
import { getGitHubAuthToken } from './auth.js';
import { logger } from '../config/logger.js';

export async function getOctokit(): Promise<Octokit> {
  const token = await getGitHubAuthToken();
  return new Octokit({ auth: token });
}

export interface CreatePullRequestParams {
  owner: string;
  repo: string;
  title: string;
  head: string; // the fix branch
  base: string; // main/master
  body: string;
}

/**
 * Creates a GitHub Pull Request
 */
export async function createGitHubPullRequest(params: CreatePullRequestParams): Promise<{ prUrl: string; prNumber: number }> {
  const octokit = await getOctokit();
  logger.info({ repo: `${params.owner}/${params.repo}`, head: params.head }, 'Creating GitHub PR');

  const response = await octokit.rest.pulls.create({
    owner: params.owner,
    repo: params.repo,
    title: params.title,
    head: params.head,
    base: params.base,
    body: params.body
  });

  return {
    prUrl: response.data.html_url,
    prNumber: response.data.number
  };
}

