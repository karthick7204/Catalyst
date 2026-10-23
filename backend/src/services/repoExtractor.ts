import { LinearIssueData } from '../types/linear.js';
import { config } from '../config/env.js';

export interface ExtractedIssueDetails {
  issueIdentifier: string;
  description: string;
  repoUrl: string;
  branchName: string;
}

// GitHub HTTPS & SSH regex
const GITHUB_HTTPS_REGEX = /https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/)?(?=[\s"'<>)\]]|$)/i;
const GITHUB_SSH_REGEX = /git@github\.com:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?=[\s"'<>)\]]|$)/i;
const ISSUE_IDENTIFIER_REGEX = /\b([A-Z]{2,10}-\d+)\b/;

/**
 * Extracts and normalizes the target GitHub repository URL.
 */
export function extractRepositoryUrl(data: LinearIssueData): string | null {
  // 1. Explicit field / custom field
  const explicitUrl = data.repositoryUrl || data.repoUrl || data.customFields?.repositoryUrl || data.customFields?.repo;
  if (explicitUrl && typeof explicitUrl === 'string') {
    const normalized = normalizeGithubUrl(explicitUrl.trim());
    if (normalized) return normalized;
  }

  // 2. Regex fallback in description or title
  const searchCorpus = `${data.description || ''}\n${data.title || ''}`;
  const httpsMatch = searchCorpus.match(GITHUB_HTTPS_REGEX);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`;
  }

  const sshMatch = searchCorpus.match(GITHUB_SSH_REGEX);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`;
  }

  // 3. Environment default fallback
  if (config.defaultGithubRepoUrl) {
    return normalizeGithubUrl(config.defaultGithubRepoUrl);
  }

  return null;
}

/**
 * Normalizes different GitHub URL formats to a standard https clone URL.
 */
export function normalizeGithubUrl(url: string): string | null {
  const httpsMatch = url.match(GITHUB_HTTPS_REGEX);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`;
  }

  const sshMatch = url.match(GITHUB_SSH_REGEX);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return `https://github.com/${owner}/${repo.replace(/\.git$/, '')}.git`;
  }

  return null;
}

/**
 * Extracts issue identifier (e.g. ENG-123).
 */
export function extractIssueIdentifier(data: LinearIssueData): string {
  if (data.identifier && data.identifier.trim()) {
    return data.identifier.trim().toUpperCase();
  }

  const match = (data.title || '').match(ISSUE_IDENTIFIER_REGEX) || (data.description || '').match(ISSUE_IDENTIFIER_REGEX);
  if (match) {
    return match[1].toUpperCase();
  }

  return `ENG-${(data.id || 'UNKNOWN').substring(0, 6).toUpperCase()}`;
}

/**
 * Extracts and prepares all issue details required for provisioning.
 */
export function extractIssueDetails(data: LinearIssueData): ExtractedIssueDetails {
  const issueIdentifier = extractIssueIdentifier(data);
  const description = data.description || '';
  const repoUrl = extractRepositoryUrl(data);

  if (!repoUrl) {
    throw new Error(
      `Unable to resolve target GitHub repository URL for issue ${issueIdentifier}. Please include a GitHub URL in the issue description or custom field.`
    );
  }

  const branchName = `fix/${issueIdentifier.toLowerCase()}`;

  return {
    issueIdentifier,
    description,
    repoUrl,
    branchName,
  };
}
