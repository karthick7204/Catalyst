import express, { Express } from 'express';
import { webhookRouter, RawBodyRequest } from './routes/webhooks.js';

export function createServer(): Express {
  const app = express();

  // Capture raw buffer for Linear HMAC signature verification
  app.use(
    express.json({
      verify: (req: RawBodyRequest, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
      limit: '5mb',
    })
  );

  app.use(express.urlencoded({ extended: true }));

  // Healthcheck endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount webhooks router
  app.use('/api/webhooks', webhookRouter);

  return app;
}
