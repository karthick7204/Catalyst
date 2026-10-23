import { createServer } from './server.js';
import { config } from './config/env.js';
import { createRepoProvisioningWorker } from './workers/repoWorker.js';
import { repoProvisioningQueue } from './queues/repoQueue.js';

async function bootstrap() {
  const app = createServer();
  const worker = createRepoProvisioningWorker();

  const server = app.listen(config.port, () => {
    console.log(`[Catalyst Bug-Fix Pipeline] Server running on port ${config.port}`);
    console.log(`[Catalyst Bug-Fix Pipeline] Webhook endpoint: POST http://localhost:${config.port}/api/webhooks/linear`);
    console.log(`[Catalyst Bug-Fix Pipeline] Target trigger label: '${config.triggerLabel}'`);
    console.log(`[Catalyst Bug-Fix Pipeline] Scratch directory: ${config.scratchDir}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}. Gracefully stopping server and worker...`);

    server.close(() => {
      console.log('[Shutdown] HTTP server closed.');
    });

    try {
      await worker.close();
      console.log('[Shutdown] BullMQ worker stopped.');

      await repoProvisioningQueue.close();
      console.log('[Shutdown] BullMQ queue closed.');
    } catch (err) {
      console.error('[Shutdown] Error during shutdown:', err);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Fatal] Pipeline failed to start:', err);
  process.exit(1);
});
