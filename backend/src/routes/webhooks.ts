import { Router, Request, Response } from 'express';
import path from 'path';
import { config } from '../config/env.js';
import { verifyLinearSignature } from '../services/linearAuth.js';
import { extractIssueDetails } from '../services/repoExtractor.js';
import { addRepoProvisioningJob } from '../queues/repoQueue.js';
import { LinearWebhookPayload } from '../types/linear.js';

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

export const webhookRouter = Router();

webhookRouter.post('/linear', async (req: RawBodyRequest, res: Response) => {
  const startTime = Date.now();

  // 1. Signature Verification
  const signature = req.headers['linear-signature'] as string | undefined;

  // In production or when LINEAR_WEBHOOK_SECRET is set, strictly enforce HMAC-SHA256 signature
  if (config.linearWebhookSecret) {
    const isValid = verifyLinearSignature(req.rawBody, signature, config.linearWebhookSecret);
    if (!isValid) {
      console.warn('[Webhook:Linear] Signature verification failed or missing signature header.');
      return res.status(401).json({
        error: 'Unauthorized: Invalid Linear webhook signature',
      });
    }
  } else {
    console.warn(
      '[Webhook:Linear] WARNING: LINEAR_WEBHOOK_SECRET not configured. Skipping signature check.'
    );
  }

  // 2. Parse Body
  let payload: LinearWebhookPayload;
  try {
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      payload = JSON.parse(req.rawBody.toString('utf8'));
    } else {
      payload = req.body as LinearWebhookPayload;
    }
  } catch (err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  // 3. Filter Actions (trigger only on 'create' or 'update')
  const action = payload.action;
  if (action !== 'create' && action !== 'update') {
    return res.status(200).json({
      status: 'ignored',
      reason: `Action '${action}' ignored. Only 'create' and 'update' are processed.`,
    });
  }

  // 4. Filter Labels (must contain 'ai-fix' or custom label)
  const labels = payload.data?.labels || [];
  const targetLabel = config.triggerLabel;
  const hasTriggerLabel = labels.some((labelItem) => {
    if (typeof labelItem === 'string') {
      return labelItem.trim().toLowerCase() === targetLabel;
    }
    return labelItem?.name?.trim().toLowerCase() === targetLabel;
  });

  if (!hasTriggerLabel) {
    return res.status(200).json({
      status: 'ignored',
      reason: `Issue labels do not include target label '${targetLabel}'.`,
    });
  }

  // 5. Extract Issue Details & Repo URL
  try {
    const details = extractIssueDetails(payload.data);
    const scratchWorkspacePath = path.join(config.scratchDir, details.issueIdentifier);

    // 6. Push to BullMQ queue
    const jobId = await addRepoProvisioningJob({
      issueId: payload.data.id,
      issueIdentifier: details.issueIdentifier,
      title: payload.data.title,
      description: details.description,
      repoUrl: details.repoUrl,
      branchName: details.branchName,
      scratchWorkspacePath,
      queuedAt: new Date().toISOString(),
    });

    const elapsedMs = Date.now() - startTime;
    console.log(
      `[Webhook:Linear] Enqueued job #${jobId} for ${details.issueIdentifier} in ${elapsedMs}ms`
    );

    // 7. Return 200 OK immediately (<500ms)
    return res.status(200).json({
      status: 'queued',
      jobId,
      issueIdentifier: details.issueIdentifier,
      repoUrl: details.repoUrl,
      branchName: details.branchName,
      responseTimeMs: elapsedMs,
    });
  } catch (error: any) {
    console.error('[Webhook:Linear] Extraction/Enqueue error:', error.message);
    return res.status(200).json({
      status: 'error',
      message: error.message,
    });
  }
});
