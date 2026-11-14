import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from './logger.js';

export const redisConnection = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true
});

redisConnection.on('connect', () => {
  logger.info('Connected to Redis');
});

redisConnection.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

