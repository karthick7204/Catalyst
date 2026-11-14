import { LinearClient } from '@linear/sdk';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let linearClientInstance: LinearClient | null = null;

export function getLinearClient(): LinearClient {
  if (!linearClientInstance) {
    if (!config.LINEAR_API_KEY) {
      throw new Error('LINEAR_API_KEY is not configured in environment variables');
    }
    linearClientInstance = new LinearClient({ apiKey: config.LINEAR_API_KEY });
  }
  return linearClientInstance;
}

/**
 * Fetch full issue details from Linear
 */
export async function fetchLinearIssue(issueId: string) {
  const client = getLinearClient();
  const issue = await client.issue(issueId);
  return issue;
}

/**
 * Post an update/comment on a Linear issue with markdown support
 */
export async function postLinearComment(issueId: string, body: string) {
  try {
    const client = getLinearClient();
    const commentPayload = await client.createComment({
      issueId,
      body
    });
    return commentPayload;
  } catch (err) {
    logger.error({ err, issueId }, 'Failed to post comment to Linear issue');
    throw err;
  }
}

/**
 * Update Linear issue state (e.g. to "In Review" or "In Progress")
 */
export async function updateLinearIssueStatus(issueId: string, stateName: string) {
  try {
    const client = getLinearClient();
    const issue = await client.issue(issueId);
    const team = await issue.team;
    if (!team) return;

    const states = await team.states();
    const targetState = states.nodes.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase()
    );

    if (targetState) {
      await client.updateIssue(issueId, { stateId: targetState.id });
      logger.info({ issueId, stateName }, 'Updated Linear issue state');
    } else {
      logger.warn({ stateName }, 'Linear workflow state not found in team');
    }
  } catch (err) {
    logger.error({ err, issueId, stateName }, 'Failed to update Linear issue status');
  }
}

