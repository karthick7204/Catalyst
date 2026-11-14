import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApprovalService } from '../approval/approvalService.js';
import { prisma } from '../config/database.js';

export async function approvalRoutes(fastify: FastifyInstance) {
  // GET endpoint for one-click browser links from Linear comments
  fastify.get(
    '/api/approvals/:jobId',
    async (
      req: FastifyRequest<{
        Params: { jobId: string };
        Querystring: { action?: string; token?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { jobId } = req.params;
      const { action, token } = req.query;

      if (!action || !token || (action !== 'approve' && action !== 'reject')) {
        reply.type('text/html');
        return reply.status(400).send(`
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #f9fafb;">
              <h2 style="color: #ef4444;">Invalid Approval Request</h2>
              <p>Missing or invalid action or security token.</p>
            </body>
          </html>
        `);
      }

      const result = await ApprovalService.handleDecision({
        jobId,
        token,
        action: action as 'approve' | 'reject'
      });

      reply.type('text/html');
      if (!result.success) {
        return reply.status(400).send(`
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #f9fafb;">
              <h2 style="color: #ef4444;">Action Failed</h2>
              <p>${result.message}</p>
            </body>
          </html>
        `);
      }

      const isApproved = action === 'approve';
      return reply.send(`
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
            <div style="max-width: 500px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
              <h1 style="color: ${isApproved ? '#22c55e' : '#f97316'};">${isApproved ? '✅ Approved & Pushed' : '❌ Fix Rejected'}</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #94a3b8;">${result.message}</p>
              ${
                result.prUrl
                  ? `<div style="margin-top: 24px;"><a href="${result.prUrl}" target="_blank" style="background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">View Pull Request on GitHub</a></div>`
                  : ''
              }
            </div>
          </body>
        </html>
      `);
    }
  );

  // POST endpoint for programmatic API actions
  fastify.post(
    '/api/approvals/:jobId',
    async (
      req: FastifyRequest<{
        Params: { jobId: string };
        Body: { action: 'approve' | 'reject'; token: string };
      }>,
      reply: FastifyReply
    ) => {
      const { jobId } = req.params;
      const { action, token } = req.body;

      if (!action || !token || (action !== 'approve' && action !== 'reject')) {
        return reply.status(400).send({ error: 'Valid action (approve|reject) and token required' });
      }

      const result = await ApprovalService.handleDecision({ jobId, token, action });
      return reply.send(result);
    }
  );
}

