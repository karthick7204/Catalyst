import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { WorkspaceSandbox } from '../sandbox/workspace.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';
import { ApprovalService } from '../approval/approvalService.js';
import { postLinearComment } from '../linear/client.js';
import { CatalystTaskJobData } from './taskQueue.js';

export function startCatalystWorker(): Worker<CatalystTaskJobData> {
  const orchestrator = new AgentOrchestrator();

  const worker = new Worker<CatalystTaskJobData>(
    'catalyst-tasks',
    async (job: Job<CatalystTaskJobData>) => {
      const { jobId } = job.data;
      logger.info({ jobId }, 'Worker picked up task');

      const taskRecord = await prisma.taskJob.findUnique({
        where: { id: jobId }
      });

      if (!taskRecord) {
        logger.error({ jobId }, 'TaskJob record not found in database');
        return;
      }

      const sandbox = new WorkspaceSandbox(
        taskRecord.id,
        taskRecord.githubRepo,
        taskRecord.linearIssueIdentifier
      );

      try {
        // Step 1: Provision sandbox & clone
        await prisma.taskJob.update({
          where: { id: jobId },
          data: { status: 'CLONING' }
        });

        await sandbox.initialize();

        // Step 2: Agent investigation and fixing loop
        await prisma.taskJob.update({
          where: { id: jobId },
          data: { status: 'FIXING' }
        });

        const result = await orchestrator.run(sandbox, {
          jobId: taskRecord.id,
          issueIdentifier: taskRecord.linearIssueIdentifier,
          issueTitle: taskRecord.linearIssueTitle,
          issueDescription: taskRecord.linearIssueDescription
        });

        if (!result.success || !result.diff) {
          throw new Error(result.error || 'Agent completed without generating a valid fix diff.');
        }

        // Step 3: Transition to AWAITING_APPROVAL and notify human
        await prisma.taskJob.update({
          where: { id: jobId },
          data: {
            status: 'AWAITING_APPROVAL',
            diffContent: result.diff,
            fixSummary: result.fixSummary
          }
        });

        await ApprovalService.requestHumanApproval({
          jobId: taskRecord.id,
          linearIssueId: taskRecord.linearIssueId,
          linearIssueIdentifier: taskRecord.linearIssueIdentifier,
          approvalToken: taskRecord.approvalToken,
          fixSummary: result.fixSummary,
          diff: result.diff
        });

        logger.info({ jobId }, 'Task successfully paused awaiting human approval');
      } catch (err: any) {
        logger.error({ err, jobId }, 'Task failed during execution');

        await prisma.taskJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: err.message
          }
        });

        await postLinearComment(
          taskRecord.linearIssueId,
          `⚠️ **Catalyst AI was unable to complete the fix for ${taskRecord.linearIssueIdentifier}**:\n\`\`\`\n${err.message}\n\`\`\``
        ).catch(() => {});

        await sandbox.cleanup();
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2 // Max parallel tasks
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Worker task failed');
  });

  return worker;
}

