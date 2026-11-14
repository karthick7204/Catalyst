import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { logger } from './config/logger.js';
import { handleLinearWebhook } from './webhooks/linearWebhook.js';
import { approvalRoutes } from './routes/approvals.js';
import { jobRoutes } from './routes/jobs.js';

export function createServer(): FastifyInstance {
  const fastify = Fastify({
    logger: false // handled by pino logger
  });

  fastify.register(cors, {
    origin: true
  });

  fastify.register(sensible);

  // Capture raw body for webhook HMAC validation
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      try {
        (req as any).rawBody = body;
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (err: any) {
        done(err, undefined);
      }
    }
  );

  // Health check
  fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Linear Webhook Endpoint
  fastify.post('/webhooks/linear', handleLinearWebhook);

  // Approval routes
  fastify.register(approvalRoutes);

  // Jobs monitoring routes
  fastify.register(jobRoutes);

  return fastify;
}

