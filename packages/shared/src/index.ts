import { z } from "zod";

export const RoleSchema = z.enum(["student", "admin", "owner"]);
export type Role = z.infer<typeof RoleSchema>;

export const TenantClaimsSchema = z.object({
  sub: z.string().uuid(),
  university_id: z.string().uuid(),
  role: RoleSchema,
  email: z.string().email().optional(),
});
export type TenantClaims = z.infer<typeof TenantClaimsSchema>;

export const ApiErrorSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  code: z.string().min(1),
  message: z.string().min(1),
  correlationId: z.string().min(1).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const ResourceStatusSchema = z.enum(["draft", "published", "unavailable", "archived"]);
export const ResourceVisibilitySchema = z.enum(["tenant", "public"]);
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  title: z.string().min(1),
  normalizedTitle: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().positive().nullable(),
  driveFileId: z.string().min(1),
  driveMd5: z.string().min(1).nullable(),
  modifiedAt: z.string().datetime().nullable(),
  status: ResourceStatusSchema,
  visibility: ResourceVisibilitySchema,
  downloadAllowed: z.boolean(),
  textQuality: z.number().min(0).max(1).nullable(),
  courseId: z.string().uuid().nullable(),
  contributorId: z.string().uuid().nullable(),
  materialKindId: z.string().uuid().nullable(),
  examPhaseId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const ResourceListQuerySchema = PaginationQuerySchema.extend({
  courseId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  materialKindId: z.string().uuid().optional(),
  examPhaseId: z.string().uuid().optional(),
  contributorId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});
export type ResourceListQuery = z.infer<typeof ResourceListQuerySchema>;

export const ResourceListResponseSchema = z.object({
  data: z.array(ResourceSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type ResourceListResponse = z.infer<typeof ResourceListResponseSchema>;

export const StreamTokenRequestSchema = z.object({
  resourceId: z.string().uuid(),
});
export type StreamTokenRequest = z.infer<typeof StreamTokenRequestSchema>;

export const StreamTokenResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().datetime(),
  url: z.string().url(),
});
export type StreamTokenResponse = z.infer<typeof StreamTokenResponseSchema>;

export const DriveOAuthStartResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string().min(1),
});
export type DriveOAuthStartResponse = z.infer<typeof DriveOAuthStartResponseSchema>;

export const DriveSyncResponseSchema = z.object({
  runId: z.string().uuid(),
  status: z.enum(["queued", "running", "completed", "failed"]),
  imported: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  unavailable: z.number().int().nonnegative(),
});
export type DriveSyncResponse = z.infer<typeof DriveSyncResponseSchema>;

export const AppConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]),
  port: z.number().int().positive(),
  apiPrefix: z.string().min(1),
  supabaseUrl: z.string().url(),
  supabaseJwksUrl: z.string().url(),
  driveMode: z.enum(["oauth_user", "shared_drive"]),
  streamTokenTtlSeconds: z.number().int().min(30).max(900),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

export const ContractVersion = "v1" as const;
