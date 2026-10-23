export interface RepoProvisioningJobData {
  issueId: string;
  issueIdentifier: string;
  title?: string;
  description?: string;
  repoUrl: string;
  branchName: string;
  scratchWorkspacePath: string;
  queuedAt: string;
}

export interface RepoProvisioningJobResult {
  issueIdentifier: string;
  repoUrl: string;
  branchName: string;
  scratchWorkspacePath: string;
  containerId: string;
  executionLogs: string;
  provisionedAt: string;
}
