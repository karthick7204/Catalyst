import { createServer } from './server.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { startCatalystWorker } from './queue/worker.js';
import { prisma } from './config/database.js';
import { redisConnection } from './config/redis.js';

async function bootstrap() {
  const server = createServer();

  // Start background queue worker
  const worker = startCatalystWorker();
  logger.info('Catalyst background worker initialized');

  // Start HTTP server
  try {
    await server.listen({
      port: config.PORT,
      host: config.HOST
    });
    logger.info(`🚀 Catalyst server listening on http://${config.HOST}:${config.PORT}`);
    logger.info(`Linear Webhook endpoint ready at: http://${config.HOST}:${config.PORT}/webhooks/linear`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, gracefully shutting down...`);
    try {
      await server.close();
      await worker.close();
      await redisConnection.quit();
      await prisma.$disconnect();
      logger.info('Catalyst shut down successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Unhandled exception during bootstrap');
  process.exit(1);
});

