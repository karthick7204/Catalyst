export type JobStatus =
  | 'QUEUED'
  | 'CLONING'
  | 'ANALYZING'
  | 'FIXING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PUSHED'
  | 'PR_CREATED'
  | 'REJECTED'
  | 'FAILED';

export interface TaskJob {
  id: string;
  linearIssueId: string;
  linearIssueIdentifier: string;
  linearIssueTitle: string;
  linearIssueDescription: string;
  linearIssueUrl: string;
  githubRepo: string;
  baseBranch: string;
  fixBranch: string;
  status: JobStatus;
  approvalToken: string;
  diffContent?: string | null;
  fixSummary?: string | null;
  testOutput?: string | null;
  prUrl?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

