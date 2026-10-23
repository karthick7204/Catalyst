import { RedisOptions } from 'ioredis';
import { config } from './env.js';

export function getRedisConnectionOptions(): RedisOptions {
  if (config.redis.url) {
    // When using URL string, ioredis parses host, port, db, and auth
    return {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    };
  }

  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  };
}
