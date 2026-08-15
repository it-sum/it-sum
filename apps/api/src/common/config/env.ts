import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  SUPABASE_JWT_ISSUER: z.string().url().optional(),
  DRIVE_MODE: z.enum(['oauth_user', 'shared_drive']).default('oauth_user'),
  DRIVE_ROOT_FOLDER_ID: z.string().min(10).optional(),
  SYNC_UNIVERSITY_ID: z.string().uuid().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_SHARED_DRIVE_ID: z.string().optional(),
  STREAM_TICKET_SECRET: z.string().min(32).optional(),
  INTERNAL_CRON_SECRET: z.string().min(32).optional(),
});

export type ApiEnv = z.infer<typeof envSchema>;

let cached: ApiEnv | undefined;

/**
 * Parse environment once per process. Optional Supabase values keep the API
 * bootable for the frontend mock mode and unit tests; any protected route fails
 * with a clear configuration error instead of silently accepting a token.
 */
export function getEnv(): ApiEnv {
  cached ??= envSchema.parse(process.env);
  return cached;
}

export function resetEnvForTests() {
  cached = undefined;
}

export function requireEnv<K extends keyof ApiEnv>(key: K): NonNullable<ApiEnv[K]> {
  const value = getEnv()[key];
  if (value == null || value === '') {
    throw new Error(`Missing required API environment variable: ${key}`);
  }
  return value as NonNullable<ApiEnv[K]>;
}

export function corsOrigins(): string[] {
  return getEnv().CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
}
