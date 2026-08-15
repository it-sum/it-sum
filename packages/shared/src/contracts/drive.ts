import { z } from 'zod';
import {
  driveModeSchema,
  examPhaseSchema,
  materialKindSchema,
  syncStatusSchema,
} from '../domain/enums';
import {
  countSchema,
  driveIdSchema,
  isoDateTimeSchema,
  md5Schema,
  paginationQuerySchema,
  uuidSchema,
} from '../domain/primitives';

/**
 * Google Drive integration contract.
 *
 * Two adapters exist because Google changed policy in April 2025: newly created
 * service accounts have no storage quota and cannot own Drive files, so uploading
 * into a personal My Drive fails outright. `oauth_user` delegates to the account
 * that owns the content (which is the situation for IT-SUM today) and
 * `shared_drive` suits a university with Workspace. Reading works in both; only
 * ownership differs, and the mode is visible here so the UI can explain it.
 */

export const driveAccountSchema = z.object({
  id: uuidSchema,
  mode: driveModeSchema,
  /** Email of the delegated user, or of the service account. */
  accountEmail: z.string().email().nullable(),
  rootFolderId: driveIdSchema,
  rootFolderName: z.string().max(300),
  sharedDriveId: driveIdSchema.nullable(),
  isConnected: z.boolean(),
  /** True when credentials exist but the API rejects them, e.g. revoked consent. */
  needsReauth: z.boolean(),
  scopes: z.array(z.string()),
  connectedAt: isoDateTimeSchema.nullable(),
  lastVerifiedAt: isoDateTimeSchema.nullable(),
});
export type DriveAccount = z.infer<typeof driveAccountSchema>;

export const driveConnectStartResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string().min(10),
  expiresAt: isoDateTimeSchema,
});
export type DriveConnectStartResponse = z.infer<typeof driveConnectStartResponseSchema>;

export const driveConnectCallbackSchema = z.object({
  code: z.string().min(10),
  state: z.string().min(10),
});
export type DriveConnectCallback = z.infer<typeof driveConnectCallbackSchema>;

/** A synchronisation run, whether triggered manually or by cron. */
export const driveSyncRunSchema = z.object({
  id: uuidSchema,
  status: syncStatusSchema,
  trigger: z.enum(['manual', 'cron', 'webhook']),
  mode: z.enum(['delta', 'full']),
  startedAt: isoDateTimeSchema,
  finishedAt: isoDateTimeSchema.nullable(),
  durationMs: countSchema.nullable(),
  foldersScanned: countSchema,
  filesScanned: countSchema,
  resourcesCreated: countSchema,
  resourcesUpdated: countSchema,
  resourcesUnavailable: countSchema,
  duplicatesSkipped: countSchema,
  conflictsFound: countSchema,
  errorMessage: z.string().max(2000).nullable(),
});
export type DriveSyncRun = z.infer<typeof driveSyncRunSchema>;

export const startSyncRequestSchema = z.object({
  mode: z.enum(['delta', 'full']).default('delta'),
  /** Limit the crawl to one subtree; useful for a single course. */
  folderId: driveIdSchema.optional(),
  dryRun: z.boolean().default(false),
});
export type StartSyncRequest = z.infer<typeof startSyncRequestSchema>;

/**
 * A proposed change awaiting administrator review. The importer never applies a
 * low-confidence mapping silently; it produces one of these instead.
 */
export const driveProposalSchema = z.object({
  id: uuidSchema,
  driveFileId: driveIdSchema,
  fileName: z.string().max(400),
  filePath: z.string().max(2000),
  sizeBytes: countSchema.nullable(),
  md5: md5Schema.nullable(),
  kind: z.enum(['new_resource', 'metadata_change', 'duplicate', 'orphan', 'deleted_in_drive']),
  /** What the importer currently believes, and what it proposes changing to. */
  current: z
    .object({
      courseId: uuidSchema.nullable(),
      courseName: z.string().nullable(),
      materialKind: materialKindSchema.nullable(),
      examPhase: examPhaseSchema.nullable(),
      contributorName: z.string().nullable(),
      displayTitle: z.string().nullable(),
    })
    .nullable(),
  proposed: z.object({
    courseId: uuidSchema.nullable(),
    courseName: z.string().nullable(),
    materialKind: materialKindSchema.nullable(),
    examPhase: examPhaseSchema.nullable(),
    contributorName: z.string().nullable(),
    displayTitle: z.string().nullable(),
  }),
  confidence: z.number().min(0).max(1),
  source: z.enum(['path_pattern', 'alias_match', 'fuzzy_match', 'ai_proposal']),
  duplicateOfResourceId: uuidSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type DriveProposal = z.infer<typeof driveProposalSchema>;

export const driveProposalQuerySchema = paginationQuerySchema.extend({
  kind: z
    .enum(['new_resource', 'metadata_change', 'duplicate', 'orphan', 'deleted_in_drive'])
    .optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  syncRunId: uuidSchema.optional(),
});
export type DriveProposalQuery = z.infer<typeof driveProposalQuerySchema>;

export const decideProposalsRequestSchema = z.object({
  proposalIds: z.array(uuidSchema).min(1).max(500),
  decision: z.enum(['accept', 'reject']),
  /** Optional overrides applied when accepting, so an admin can correct a guess. */
  overrides: z
    .object({
      courseId: uuidSchema.nullable().optional(),
      materialKind: materialKindSchema.optional(),
      examPhase: examPhaseSchema.optional(),
      displayTitle: z.string().max(400).optional(),
    })
    .optional(),
});
export type DecideProposalsRequest = z.infer<typeof decideProposalsRequestSchema>;

export const driveHealthSchema = z.object({
  mode: driveModeSchema,
  isHealthy: z.boolean(),
  canRead: z.boolean(),
  canWrite: z.boolean(),
  /** Present when write access is impossible, explaining exactly why. */
  writeBlockedReason: z.string().max(500).nullable(),
  quotaWarning: z.string().max(500).nullable(),
  lastSyncAt: isoDateTimeSchema.nullable(),
  lastSyncStatus: syncStatusSchema.nullable(),
  pendingProposals: countSchema,
});
export type DriveHealth = z.infer<typeof driveHealthSchema>;

/** Import YouTube links harvested from a Google Form or Sheet. */
export const videoImportRequestSchema = z.object({
  source: z.enum(['form', 'sheet', 'manual']),
  driveFileId: driveIdSchema.optional(),
  urls: z.array(z.string().url()).max(500).optional(),
  courseId: uuidSchema.nullable().optional(),
  dryRun: z.boolean().default(true),
});
export type VideoImportRequest = z.infer<typeof videoImportRequestSchema>;

export const videoImportResultSchema = z.object({
  found: countSchema,
  valid: countSchema,
  created: countSchema,
  skippedDuplicates: countSchema,
  notEmbeddable: z.array(z.string()),
  errors: z.array(z.object({ url: z.string(), message: z.string() })),
});
export type VideoImportResult = z.infer<typeof videoImportResultSchema>;
