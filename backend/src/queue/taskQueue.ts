import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export interface CatalystTaskJobData {
  jobId: string;
}

export const catalystQueue = new Queue<CatalystTaskJobData>('catalyst-tasks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      count: 100
    },
    removeOnFail: {
      count: 200
    }
  }
});

