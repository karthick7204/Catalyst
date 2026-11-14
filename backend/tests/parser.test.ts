import { describe, it, expect } from 'vitest';
import { extractGitHubRepo } from '../src/linear/parser.js';

describe('Linear GitHub Repo Parser', () => {
  it('extracts owner and repo from full https GitHub URL', () => {
    const text = 'There is a bug in https://github.com/facebook/react when rendering empty lists.';
    const result = extractGitHubRepo(text);
    expect(result).not.toBeNull();
    expect(result?.owner).toBe('facebook');
    expect(result?.repo).toBe('react');
    expect(result?.fullName).toBe('facebook/react');
  });

  it('extracts owner and repo with .git suffix', () => {
    const text = 'Repo: https://github.com/owner/my-app.git please fix';
    const result = extractGitHubRepo(text);
    expect(result?.fullName).toBe('owner/my-app');
  });

  it('extracts owner and repo from domain shorthand', () => {
    const text = 'Investigate issue in github.com/pallets/flask please.';
    const result = extractGitHubRepo(text);
    expect(result?.fullName).toBe('pallets/flask');
  });

  it('extracts owner and repo from explicit markdown label', () => {
    const text = 'Repository: vercel/next.js\nPlease fix error in router.';
    const result = extractGitHubRepo(text);
    expect(result?.fullName).toBe('vercel/next.js');
  });

  it('returns null when no repo is present', () => {
    const text = 'Just a general bug without any repo link mentioned.';
    const result = extractGitHubRepo(text);
    expect(result).toBeNull();
  });
});

