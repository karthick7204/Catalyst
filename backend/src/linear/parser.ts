export interface ExtractedRepoInfo {
  owner: string;
  repo: string;
  fullUrl: string;
  fullName: string; // "owner/repo"
}

/**
 * Extracts a GitHub repository owner and name from text (description, comments, etc.)
 */
export function extractGitHubRepo(text?: string | null): ExtractedRepoInfo | null {
  if (!text) return null;

  // Pattern 1: Full URL https://github.com/owner/repo (with optional .git or trailing slash)
  const fullUrlRegex = /https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/|$|\s|\))/;
  const matchFull = text.match(fullUrlRegex);
  if (matchFull) {
    const owner = matchFull[1];
    const repo = matchFull[2].replace(/\.git$/, '');
    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      fullUrl: `https://github.com/${owner}/${repo}`
    };
  }

  // Pattern 2: github.com/owner/repo
  const shortDomainRegex = /(?:^|\s)github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/|$|\s|\))/;
  const matchShort = text.match(shortDomainRegex);
  if (matchShort) {
    const owner = matchShort[1];
    const repo = matchShort[2].replace(/\.git$/, '');
    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      fullUrl: `https://github.com/${owner}/${repo}`
    };
  }

  // Pattern 3: explicit markdown/label e.g. "Repo: owner/repo" or "Repository: owner/repo"
  const labelRegex = /(?:repo|repository)\s*:\s*([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i;
  const matchLabel = text.match(labelRegex);
  if (matchLabel) {
    const owner = matchLabel[1];
    const repo = matchLabel[2].replace(/\.git$/, '');
    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      fullUrl: `https://github.com/${owner}/${repo}`
    };
  }

  // Pattern 4: Local repository path (for offline / sandbox testing)
  const localRegex = /(?:repo|repository|target\s+repository)\s*:\s*(\/[a-zA-Z0-9_./-]+)/i;
  const matchLocal = text.match(localRegex);
  if (matchLocal) {
    const localPath = matchLocal[1].replace(/\/+$/, '');
    const repoName = localPath.split('/').pop() || 'demo-repo';
    return {
      owner: 'local',
      repo: repoName,
      fullName: localPath,
      fullUrl: localPath
    };
  }

  return null;
}

