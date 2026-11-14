import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_BASE_URL: z.string().default('http://localhost:3000'),

  // Linear
  LINEAR_WEBHOOK_SECRET: z.string().optional(),
  LINEAR_API_KEY: z.string().optional(),

  // GitHub App / Token
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_APP_INSTALLATION_ID: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),

  // AI Provider
  AI_PROVIDER: z.enum(['gemini', 'anthropic', 'openai']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL_NAME: z.string().default('gemini-3.1-flash-lite'),

  // Storage & Queue
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/catalyst?schema=public'),

  // Sandboxing
  SANDBOX_WORKSPACES_ROOT: z.string().default('/tmp/catalyst-workspaces'),
  AGENT_EXECUTION_TIMEOUT_MS: z.coerce.number().default(600000)
});

export const config = envSchema.parse(process.env);

