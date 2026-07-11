import { z } from 'zod';

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_ISSUER: z.string().optional(),
  OIDC_NAME: z.string().optional(),
  ENABLE_REGISTRATION: z.coerce.boolean().default(false),
  CONNECTION_ENCRYPTION_KEY: z.string().min(32).default('change-me-32-chars-minimum!!'),
  GUACD_HOST: z.string().default('localhost'),
  GUACD_PORT: z.coerce.number().default(4822),
});

export const env = envSchema.parse(process.env);
