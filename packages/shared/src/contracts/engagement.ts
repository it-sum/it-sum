import { z } from 'zod';
import {
  localeSchema,
  notificationChannelSchema,
  notificationTypeSchema,
  publicationStateSchema,
} from '../domain/enums.js';
import {
  bilingualRichTextSchema,
  bilingualTextSchema,
  countSchema,
  emailSchema,
  isoDateTimeSchema,
  paginationQuerySchema,
  percentSchema,
  positiveIntSchema,
  slugSchema,
  uuidSchema,
} from '../domain/primitives.js';

/**
 * Engagement contract: notifications, roadmaps, contact and moderation.
 *
 * Notification preferences are per-type rather than a single on/off switch,
 * because a student who mutes progress reminders probably still wants to know
 * their account was approved. Reminders are opt-in and capped per day.
 */

export const notificationSchema = z.object({
  id: uuidSchema,
  type: notificationTypeSchema,
  title: z.string().max(200),
  body: z.string().max(1000),
  /** Deep link that resumes exactly where the notification points. */
  href: z.string().max(500).nullable(),
  iconName: z.string().max(60).nullable(),
  isRead: z.boolean(),
  createdAt: isoDateTimeSchema,
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationQuerySchema = paginationQuerySchema.extend({
  onlyUnread: z.coerce.boolean().optional(),
  type: notificationTypeSchema.optional(),
});
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

/** One row of the per-type, per-channel preference matrix. */
export const notificationPreferenceSchema = z.object({
  type: notificationTypeSchema,
  channels: z.array(notificationChannelSchema),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export const updateNotificationPreferencesRequestSchema = z.object({
  preferences: z.array(notificationPreferenceSchema).max(20),
  /** Hard ceiling on reminder emails per day, regardless of triggers. */
  maxEmailsPerDay: z.number().int().min(0).max(10).optional(),
});
export type UpdateNotificationPreferencesRequest = z.infer<
  typeof updateNotificationPreferencesRequestSchema
>;

export const announcementSchema = z.object({
  id: uuidSchema,
  title: bilingualTextSchema,
  body: bilingualRichTextSchema,
  audience: z.enum(['all', 'department', 'batch', 'course', 'admins']),
  audienceId: uuidSchema.nullable(),
  isPinned: z.boolean(),
  sendEmail: z.boolean(),
  publishedAt: isoDateTimeSchema.nullable(),
  expiresAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type Announcement = z.infer<typeof announcementSchema>;

export const createAnnouncementRequestSchema = z.object({
  title: bilingualTextSchema,
  body: bilingualRichTextSchema,
  audience: z.enum(['all', 'department', 'batch', 'course', 'admins']).default('all'),
  audienceId: uuidSchema.nullable().optional(),
  isPinned: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
  expiresAt: isoDateTimeSchema.nullable().optional(),
  publishNow: z.boolean().default(true),
});
export type CreateAnnouncementRequest = z.infer<typeof createAnnouncementRequestSchema>;

/**
 * Roadmaps are modelled and rendered in-house. roadmap.sh content is copyrighted,
 * so external roadmaps are referenced by link only, never copied.
 */
export const roadmapNodeSchema = z.object({
  id: uuidSchema,
  roadmapId: uuidSchema,
  parentId: uuidSchema.nullable(),
  title: bilingualTextSchema,
  description: bilingualRichTextSchema,
  kind: z.enum(['topic', 'subtopic', 'milestone', 'optional']),
  estimatedHours: z.number().min(0).max(500).nullable(),
  externalUrl: z.string().url().nullable(),
  sortOrder: z.number().int().min(0),
  resourceIds: z.array(uuidSchema),
  isCompleted: z.boolean(),
  completedAt: isoDateTimeSchema.nullable(),
});
export type RoadmapNode = z.infer<typeof roadmapNodeSchema>;

export const roadmapEdgeSchema = z.object({
  fromNodeId: uuidSchema,
  toNodeId: uuidSchema,
  kind: z.enum(['prerequisite', 'related']),
});
export type RoadmapEdge = z.infer<typeof roadmapEdgeSchema>;

export const roadmapSchema = z.object({
  id: uuidSchema,
  slug: slugSchema,
  title: bilingualTextSchema,
  description: bilingualRichTextSchema,
  coverImageUrl: z.string().url().nullable(),
  courseId: uuidSchema.nullable(),
  externalReferenceUrl: z.string().url().nullable(),
  state: publicationStateSchema,
  nodeCount: countSchema,
  completedNodeCount: countSchema,
  progressPercent: percentSchema,
  estimatedHours: z.number().min(0).nullable(),
  createdAt: isoDateTimeSchema,
});
export type Roadmap = z.infer<typeof roadmapSchema>;

export const roadmapDetailSchema = roadmapSchema.extend({
  nodes: z.array(roadmapNodeSchema),
  edges: z.array(roadmapEdgeSchema),
});
export type RoadmapDetail = z.infer<typeof roadmapDetailSchema>;

export const setRoadmapNodeProgressRequestSchema = z.object({
  nodeId: uuidSchema,
  isCompleted: z.boolean(),
});
export type SetRoadmapNodeProgressRequest = z.infer<typeof setRoadmapNodeProgressRequestSchema>;

export const contactMessageRequestSchema = z.object({
  name: z.string().min(2).max(160),
  email: emailSchema,
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  locale: localeSchema.default('ar'),
  /** Honeypot field: must stay empty. Bots fill it, humans never see it. */
  website: z.string().max(0).optional(),
});
export type ContactMessageRequest = z.infer<typeof contactMessageRequestSchema>;

export const contactMessageSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
  locale: localeSchema,
  status: z.enum(['new', 'read', 'replied', 'spam', 'closed']),
  replyBody: z.string().nullable(),
  repliedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

export const contentReportRequestSchema = z.object({
  resourceId: uuidSchema,
  reason: z.enum(['wrong_course', 'poor_quality', 'copyright', 'broken_file', 'duplicate', 'other']),
  details: z.string().max(2000).optional(),
});
export type ContentReportRequest = z.infer<typeof contentReportRequestSchema>;

export const contentReportSchema = z.object({
  id: uuidSchema,
  resourceId: uuidSchema,
  resourceTitle: z.string(),
  reason: z.enum(['wrong_course', 'poor_quality', 'copyright', 'broken_file', 'duplicate', 'other']),
  details: z.string().nullable(),
  status: z.enum(['open', 'resolved', 'dismissed']),
  reportedAt: isoDateTimeSchema,
  resolvedAt: isoDateTimeSchema.nullable(),
});
export type ContentReport = z.infer<typeof contentReportSchema>;

/** Audit trail entry. Written for every privileged mutation. */
export const auditLogEntrySchema = z.object({
  id: uuidSchema,
  actorId: uuidSchema.nullable(),
  actorEmail: z.string().nullable(),
  action: z.string().max(120),
  entityType: z.string().max(80),
  entityId: z.string().max(120).nullable(),
  before: z.record(z.unknown()).nullable(),
  after: z.record(z.unknown()).nullable(),
  correlationId: z.string().max(120).nullable(),
  createdAt: isoDateTimeSchema,
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const auditLogQuerySchema = paginationQuerySchema.extend({
  actorId: uuidSchema.optional(),
  action: z.string().max(120).optional(),
  entityType: z.string().max(80).optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

/** Aggregate counters for the admin overview screen. */
export const adminDashboardSchema = z.object({
  students: z.object({
    total: countSchema,
    pending: countSchema,
    activeThisWeek: countSchema,
  }),
  content: z.object({
    resources: countSchema,
    published: countSchema,
    videos: countSchema,
    quizzes: countSchema,
    totalSizeBytes: countSchema,
  }),
  activity: z.object({
    resourceViewsThisWeek: countSchema,
    quizAttemptsThisWeek: countSchema,
    newRegistrationsThisWeek: countSchema,
  }),
  attention: z.object({
    pendingApprovals: countSchema,
    pendingDriveProposals: countSchema,
    openReports: countSchema,
    unreadContactMessages: countSchema,
    failedSyncRuns: countSchema,
    aiReviewQueue: countSchema,
  }),
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

/** Public landing-page statistics, safe to serve unauthenticated. */
export const publicStatsSchema = z.object({
  resourceCount: countSchema,
  videoCount: countSchema,
  quizCount: countSchema,
  courseCount: countSchema,
  departmentCount: countSchema,
  studentCount: countSchema,
  totalPages: countSchema,
});
export type PublicStats = z.infer<typeof publicStatsSchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  version: z.string(),
  uptimeSeconds: positiveIntSchema,
  checks: z.array(
    z.object({
      name: z.string(),
      status: z.enum(['ok', 'degraded', 'down']),
      latencyMs: countSchema.nullable(),
      message: z.string().nullable(),
    }),
  ),
  timestamp: isoDateTimeSchema,
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
