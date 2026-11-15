import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

export async function jobRoutes(fastify: FastifyInstance) {
  fastify.get('/api/jobs', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const jobs = await prisma.taskJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          logs: {
            orderBy: { stepNumber: 'asc' }
          }
        }
      });
      return reply.send({ jobs });
    } catch (err: any) {
      logger.error({ err }, 'Failed to fetch jobs from database');
      return reply.status(500).send({ error: 'Database query failed', message: err.message, jobs: [] });
    }
  });

  fastify.get(
    '/api/jobs/:id',
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = req.params;
        const job = await prisma.taskJob.findUnique({
          where: { id },
          include: {
            logs: {
              orderBy: { stepNumber: 'asc' }
            }
          }
        });

        if (!job) {
          return reply.status(404).send({ error: 'Job not found' });
        }

        return reply.send({ job });
      } catch (err: any) {
        logger.error({ err }, 'Failed to fetch job details');
        return reply.status(500).send({ error: 'Failed to fetch job', message: err.message });
      }
    }
  );
}
