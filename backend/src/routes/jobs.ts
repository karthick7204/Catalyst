import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database.js';

export async function jobRoutes(fastify: FastifyInstance) {
  fastify.get('/api/jobs', async (req: FastifyRequest, reply: FastifyReply) => {
    const jobs = await prisma.taskJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return reply.send({ jobs });
  });

  fastify.get(
    '/api/jobs/:id',
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = req.params;
      const job = await prisma.taskJob.findUnique({
        where: { id },
        include: { logs: true }
      });

      if (!job) {
        return reply.status(404).send({ error: 'Job not found' });
      }

      return reply.send({ job });
    }
  );
}

