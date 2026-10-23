import { Worker, Job } from 'bullmq';
import { getRedisConnectionOptions } from '../config/redis.js';
import { QUEUE_NAME } from '../queues/repoQueue.js';
import { RepoProvisioningJobData, RepoProvisioningJobResult } from '../types/job.js';
import { dockerSandboxService } from '../services/dockerSandbox.js';

export function createRepoProvisioningWorker(concurrency: number = 2): Worker {
  const worker = new Worker<RepoProvisioningJobData, RepoProvisioningJobResult>(
    QUEUE_NAME,
    async (job: Job<RepoProvisioningJobData, RepoProvisioningJobResult>) => {
      console.log(
        `[Worker] Processing job #${job.id} for issue ${job.data.issueIdentifier} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`
      );

      // Execute ephemeral sandbox provisioning
      const result = await dockerSandboxService.provisionSandbox(job.data);
      return result;
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency,
    }
  );

  worker.on('completed', (job: Job, result: RepoProvisioningJobResult) => {
    console.log(
      `[Worker:Completed] Job #${job.id} (${result.issueIdentifier}) provisioned successfully at ${result.scratchWorkspacePath}`
    );
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    console.error(
      `[Worker:Failed] Job #${job?.id} (${job?.data?.issueIdentifier}) failed after ${job?.attemptsMade} attempts: ${error.message}`
    );
  });

  worker.on('error', (err: Error) => {
    console.error('[Worker:Error] Unexpected worker error:', err);
  });

  return worker;
}
