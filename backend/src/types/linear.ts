export interface LinearLabel {
  id?: string;
  name: string;
  color?: string;
}

export interface LinearIssueData {
  id: string;
  identifier?: string;
  title?: string;
  description?: string;
  labels?: (LinearLabel | string)[];
  repositoryUrl?: string;
  repoUrl?: string;
  [key: string]: any;
}

export interface LinearWebhookPayload {
  action: 'create' | 'update' | 'remove' | string;
  type: string;
  data: LinearIssueData;
  url?: string;
  createdAt?: string;
  webhookTimestamp?: number;
}
