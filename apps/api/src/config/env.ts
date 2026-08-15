import { z } from "zod";

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().min(1).default("api/v1"),
  PUBLIC_API_BASE_URL: z.string().url().optional(),
  SERVICE_VERSION: z.string().min(1).default("0.1.0"),
  SUPABASE_URL: z.string().url().default("https://ztujhryukdddhjymhfod.supabase.co"),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  SUPABASE_ISSUER: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STREAM_SIGNING_SECRET: z.string().min(32).default("local-development-stream-signing-secret-change-me"),
  STREAM_TOKEN_TTL_SECONDS: z.coerce.number().int().min(30).max(900).default(300),
  DRIVE_TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  DRIVE_MODE: z.enum(["oauth_user", "shared_drive"]).default("oauth_user"),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3001/api/v1/drive/oauth/callback"),
  GOOGLE_SHARED_DRIVE_ID: z.string().min(1).optional(),
  DRIVE_ROOT_FOLDER_ID: z.string().min(1).optional(),
});

export type Environment = z.infer<typeof EnvironmentSchema> & {
  SUPABASE_JWKS_URL: string;
};

export function parseEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = EnvironmentSchema.parse(input);
  return {
    ...parsed,
    SUPABASE_JWKS_URL: parsed.SUPABASE_JWKS_URL ?? `${parsed.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  };
}
