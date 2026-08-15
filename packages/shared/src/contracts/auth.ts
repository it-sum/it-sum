import { z } from 'zod';
import {
  batchLevelSchema,
  leaderboardVisibilitySchema,
  localeSchema,
  themeSchema,
  userRoleSchema,
  userStatusSchema,
} from '../domain/enums';
import {
  emailSchema,
  isoDateTimeSchema,
  passwordSchema,
  uuidSchema,
} from '../domain/primitives';

/**
 * Authentication and profile contract.
 *
 * Tokens are minted by Supabase Auth; the API verifies them against the project
 * JWKS and reads role and tenant from custom claims. The web app therefore never
 * needs to trust client-side role state — it renders what these schemas describe
 * and the server independently authorises every request.
 */

/** Claims the API expects to find on a verified Supabase access token. */
export const jwtClaimsSchema = z.object({
  sub: uuidSchema,
  email: z.string().email(),
  role: z.string(),
  app_role: userRoleSchema,
  university_id: uuidSchema.nullable(),
  user_status: userStatusSchema,
  session_id: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  exp: z.number().int(),
  iat: z.number().int(),
});
export type JwtClaims = z.infer<typeof jwtClaimsSchema>;

/** Per-user preferences, all client-editable. */
export const userPreferencesSchema = z.object({
  locale: localeSchema,
  theme: themeSchema,
  leaderboardVisibility: leaderboardVisibilitySchema,
  emailNotifications: z.boolean(),
  progressReminders: z.boolean(),
  reduceMotion: z.boolean(),
});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const defaultUserPreferences: UserPreferences = {
  locale: 'ar',
  theme: 'light',
  leaderboardVisibility: 'partial_name',
  emailNotifications: true,
  progressReminders: true,
  reduceMotion: false,
};

/** The authenticated user as the web app sees itself. */
export const currentUserSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  fullName: z.string().min(1).max(160),
  displayName: z.string().min(1).max(80).nullable(),
  avatarUrl: z.string().url().nullable(),
  role: userRoleSchema,
  status: userStatusSchema,
  universityId: uuidSchema.nullable(),
  departmentId: uuidSchema.nullable(),
  batchLevel: batchLevelSchema.nullable(),
  preferences: userPreferencesSchema,
  emailVerified: z.boolean(),
  createdAt: isoDateTimeSchema,
  lastSeenAt: isoDateTimeSchema.nullable(),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

/** A brief public view of a user, safe to show to other students. */
export const publicUserSchema = z.object({
  id: uuidSchema,
  displayName: z.string().min(1).max(80),
  avatarUrl: z.string().url().nullable(),
  batchLevel: batchLevelSchema.nullable(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2).max(160),
  departmentId: uuidSchema.nullable(),
  batchLevel: batchLevelSchema.nullable(),
  locale: localeSchema.default('ar'),
  invitationToken: z.string().min(10).max(200).optional(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to register' }),
  }),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const registerResponseSchema = z.object({
  userId: uuidSchema,
  status: userStatusSchema,
  requiresEmailVerification: z.boolean(),
  requiresAdminApproval: z.boolean(),
});
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Session envelope returned to the client after a successful sign-in. */
export const sessionSchema = z.object({
  accessToken: z.string().min(10),
  refreshToken: z.string().min(10),
  expiresAt: isoDateTimeSchema,
  tokenType: z.literal('bearer'),
  user: currentUserSchema,
});
export type Session = z.infer<typeof sessionSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10).max(500),
  password: passwordSchema,
});
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

export const updateProfileRequestSchema = z.object({
  fullName: z.string().min(2).max(160).optional(),
  displayName: z.string().min(1).max(80).nullable().optional(),
  departmentId: uuidSchema.nullable().optional(),
  batchLevel: batchLevelSchema.nullable().optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const updatePreferencesRequestSchema = userPreferencesSchema.partial();
export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesRequestSchema>;

/** An admin-issued invitation, the alternative to open registration. */
export const invitationSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  role: userRoleSchema,
  departmentId: uuidSchema.nullable(),
  batchLevel: batchLevelSchema.nullable(),
  expiresAt: isoDateTimeSchema,
  acceptedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type Invitation = z.infer<typeof invitationSchema>;

export const createInvitationsRequestSchema = z.object({
  emails: z.array(emailSchema).min(1).max(200),
  role: userRoleSchema.default('student'),
  departmentId: uuidSchema.nullable().optional(),
  batchLevel: batchLevelSchema.nullable().optional(),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});
export type CreateInvitationsRequest = z.infer<typeof createInvitationsRequestSchema>;

/** A pending registration awaiting administrator approval. */
export const approvalRequestSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  email: z.string().email(),
  fullName: z.string(),
  departmentId: uuidSchema.nullable(),
  batchLevel: batchLevelSchema.nullable(),
  requestedAt: isoDateTimeSchema,
  note: z.string().max(1000).nullable(),
});
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

export const decideApprovalRequestSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(1000).optional(),
});
export type DecideApprovalRequest = z.infer<typeof decideApprovalRequestSchema>;

export const setUserRoleRequestSchema = z.object({
  role: userRoleSchema,
  reason: z.string().max(1000).optional(),
});
export type SetUserRoleRequest = z.infer<typeof setUserRoleRequestSchema>;
