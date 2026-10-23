import { Queue, JobsOptions } from 'bullmq';
import { getRedisConnectionOptions } from '../config/redis.js';
import { RepoProvisioningJobData } from '../types/job.js';

export const QUEUE_NAME = 'repo-provisioning-queue';

export const defaultJobOptions: JobsOptions = {
  attempts: 3, // 1 initial attempt + max 2 retries
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s backoff
  },
  removeOnComplete: {
    count: 200,
    age: 24 * 3600, // keep 24 hours
  },
  removeOnFail: {
    count: 500,
    age: 7 * 24 * 3600, // keep 7 days for audit
  },
};

export const repoProvisioningQueue = new Queue<RepoProvisioningJobData>(QUEUE_NAME, {
  connection: getRedisConnectionOptions(),
  defaultJobOptions,
});

/**
 * Adds a new repository provisioning job to the queue.
 */
export async function addRepoProvisioningJob(
  jobData: RepoProvisioningJobData
): Promise<string> {
  // Use issueIdentifier as custom job ID to prevent duplicate processing of the same issue
  const job = await repoProvisioningQueue.add(
    `provision-${jobData.issueIdentifier}`,
    jobData,
    {
      jobId: `${jobData.issueIdentifier}-${Date.now()}`,
    }
  );

  return job.id || 'unknown';
}
