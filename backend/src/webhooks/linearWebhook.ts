import crypto from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { extractGitHubRepo } from '../linear/parser.js';
import { prisma } from '../config/database.js';
import { catalystQueue } from '../queue/taskQueue.js';
import { ApprovalService } from '../approval/approvalService.js';
import { postLinearComment } from '../linear/client.js';

export function verifyLinearWebhookSignature(rawBody: string, signature?: string): boolean {
  if (!config.LINEAR_WEBHOOK_SECRET) {
    return true;
  }

  // Allow unsigned requests in development mode for local script testing
  if (config.NODE_ENV === 'development' && !signature) {
    logger.warn('Skipping webhook signature verification for unsigned request in development mode');
    return true;
  }

  if (!signature) return false;

  try {
    const hmac = crypto.createHmac('sha256', config.LINEAR_WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (err) {
    return false;
  }
}

export async function handleLinearWebhook(req: FastifyRequest, reply: FastifyReply) {
  const signature = req.headers['linear-signature'] as string | undefined;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!verifyLinearWebhookSignature(rawBody, signature)) {
    logger.warn('Invalid Linear webhook signature rejected');
    return reply.status(401).send({ error: 'Invalid webhook signature' });
  }

  const payload = req.body as any;
  const { action, type, data } = payload || {};

  logger.info({ action, type, id: data?.id, identifier: data?.identifier }, 'Received Linear webhook event');

  // We are interested in Issue creation or update
  if (type !== 'Issue' || (action !== 'create' && action !== 'update')) {
    return reply.status(200).send({ message: 'Ignored non-issue event' });
  }

  const issueId = data.id;
  const identifier = data.identifier || `ISSUE-${issueId.slice(0, 6)}`;
  const title = data.title || 'Untitled Issue';
  const description = data.description || '';
  const issueUrl = data.url || `https://linear.app/issue/${identifier}`;

  // Check if repository link is present in the issue description
  const repoInfo = extractGitHubRepo(description);
  if (!repoInfo) {
    logger.info({ identifier }, 'No GitHub repository link found in issue description');
    return reply.status(200).send({
      message: 'No GitHub repository detected in issue description. Skipping auto-fix.'
    });
  }

  // Prevent duplicate concurrent runs for the same Linear issue
  const existingActiveJob = await prisma.taskJob.findFirst({
    where: {
      linearIssueId: issueId,
      status: {
        in: ['QUEUED', 'CLONING', 'ANALYZING', 'FIXING', 'AWAITING_APPROVAL']
      }
    }
  });

  if (existingActiveJob) {
    logger.info({ issueId, jobId: existingActiveJob.id }, 'Active job already in progress for issue');
    return reply.status(200).send({
      message: 'Task already active for this issue',
      jobId: existingActiveJob.id
    });
  }

  const approvalToken = ApprovalService.generateToken();

  // Create TaskJob in database
  const taskJob = await prisma.taskJob.create({
    data: {
      linearIssueId: issueId,
      linearIssueIdentifier: identifier,
      linearIssueTitle: title,
      linearIssueDescription: description,
      linearIssueUrl: issueUrl,
      githubRepo: repoInfo.fullName,
      fixBranch: `catalyst/fix-${identifier.toLowerCase()}`,
      status: 'QUEUED',
      approvalToken
    }
  });

  // Enqueue job for background processing
  await catalystQueue.add(`task-${taskJob.id}`, { jobId: taskJob.id });

  // Acknowledge on Linear ticket
  await postLinearComment(
    issueId,
    `🤖 **Catalyst AI Agent triggered**\n\nIdentified repository: \`${repoInfo.fullName}\`.\nInvestigating codebase and generating fix...`
  ).catch((err) => logger.warn({ err }, 'Failed to post initial acknowledgement to Linear'));

  logger.info({ jobId: taskJob.id, identifier, repo: repoInfo.fullName }, 'Job created and enqueued');

  return reply.status(200).send({
    success: true,
    message: 'Catalyst task enqueued',
    jobId: taskJob.id
  });
}

