import { z } from 'zod';

/**
 * Domain enumerations for IT-SUM.
 *
 * These are the vocabulary of the whole product. They are derived from the real
 * Google Drive tree (`ملخصات قسم IT`), not invented: the folder hierarchy encodes
 * batch, semester, course, exam phase, material type and contributor, and every
 * one of those becomes a first-class facet here.
 */

/** Interface and content languages. Arabic is the default locale. */
export const LOCALES = ['ar', 'en'] as const;
export const localeSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof localeSchema>;
export const DEFAULT_LOCALE: Locale = 'ar';

/** Text direction implied by a locale. */
export const DIRECTIONS = ['rtl', 'ltr'] as const;
export const directionSchema = z.enum(DIRECTIONS);
export type Direction = z.infer<typeof directionSchema>;

export const LOCALE_DIRECTION: Record<Locale, Direction> = {
  ar: 'rtl',
  en: 'ltr',
};

/** Colour theme. Light is the default per the brand direction. */
export const THEMES = ['light', 'dark', 'system'] as const;
export const themeSchema = z.enum(THEMES);
export type Theme = z.infer<typeof themeSchema>;

/**
 * Roles. `owner` exists so the founding administrator cannot be demoted by
 * another admin, which would otherwise be an irreversible lockout.
 */
export const USER_ROLES = ['student', 'admin', 'owner'] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Roles that may access the admin console. */
export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'owner'];

/**
 * Account lifecycle. Hybrid registration means a verified student still lands in
 * `pending` until an administrator approves them.
 */
export const USER_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const;
export const userStatusSchema = z.enum(USER_STATUSES);
export type UserStatus = z.infer<typeof userStatusSchema>;

/** Academic batch (called "Level" in the source Drive tree). */
export const BATCH_LEVELS = [1, 2, 3, 4] as const;
export const batchLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type BatchLevel = z.infer<typeof batchLevelSchema>;

/** Two semesters per batch. */
export const SEMESTER_TERMS = ['first', 'second'] as const;
export const semesterTermSchema = z.enum(SEMESTER_TERMS);
export type SemesterTerm = z.infer<typeof semesterTermSchema>;

/**
 * Material kind — what a document *is*. Mapped from folder names such as
 * `ملخصات` (summary) and `محاضرات و شيتات غير محلولة` (lecture / unsolved sheet).
 */
export const MATERIAL_KINDS = [
  'summary',
  'lecture',
  'sheet',
  'solution',
  'tutorial',
  'assignment',
  'exam',
  'reference',
  'other',
] as const;
export const materialKindSchema = z.enum(MATERIAL_KINDS);
export type MaterialKind = z.infer<typeof materialKindSchema>;

/**
 * Exam phase — when in the term a document is relevant. Mapped from
 * `ما قبل ميدترم`, `ميدترم`, `ما بعد ميدترم`, `فاينل`.
 */
export const EXAM_PHASES = ['pre_midterm', 'midterm', 'post_midterm', 'final', 'unphased'] as const;
export const examPhaseSchema = z.enum(EXAM_PHASES);
export type ExamPhase = z.infer<typeof examPhaseSchema>;

/** Resource media type. */
export const RESOURCE_TYPES = ['pdf', 'video', 'document', 'image', 'link', 'archive'] as const;
export const resourceTypeSchema = z.enum(RESOURCE_TYPES);
export type ResourceType = z.infer<typeof resourceTypeSchema>;

/** Publication state. Nothing is visible to students until `published`. */
export const PUBLICATION_STATES = ['draft', 'published', 'archived', 'unavailable'] as const;
export const publicationStateSchema = z.enum(PUBLICATION_STATES);
export type PublicationState = z.infer<typeof publicationStateSchema>;

/**
 * Extracted-text quality. Drives whether search and AI features can operate on a
 * document: many source PDFs are CamScanner scans with no text layer at all.
 */
export const TEXT_QUALITIES = ['none', 'poor', 'fair', 'good'] as const;
export const textQualitySchema = z.enum(TEXT_QUALITIES);
export type TextQuality = z.infer<typeof textQualitySchema>;

/** Question formats supported by the quiz engine. */
export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'short_answer',
] as const;
export const questionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof questionTypeSchema>;

/** Quiz attempt lifecycle. */
export const ATTEMPT_STATUSES = ['in_progress', 'submitted', 'expired', 'abandoned'] as const;
export const attemptStatusSchema = z.enum(ATTEMPT_STATUSES);
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;

/** How a student chooses to appear on leaderboards. */
export const LEADERBOARD_VISIBILITIES = ['full_name', 'partial_name', 'anonymous', 'hidden'] as const;
export const leaderboardVisibilitySchema = z.enum(LEADERBOARD_VISIBILITIES);
export type LeaderboardVisibility = z.infer<typeof leaderboardVisibilitySchema>;

/** Scope a leaderboard is computed over. */
export const LEADERBOARD_SCOPES = ['quiz', 'course', 'semester', 'batch', 'department'] as const;
export const leaderboardScopeSchema = z.enum(LEADERBOARD_SCOPES);
export type LeaderboardScope = z.infer<typeof leaderboardScopeSchema>;

/** Reasons points can be awarded. Used as the reward-rule key. */
export const POINT_REASONS = [
  'quiz_completed',
  'quiz_perfect_score',
  'resource_completed',
  'video_completed',
  'course_completed',
  'streak_milestone',
  'roadmap_node_completed',
  'first_login',
  'contribution_approved',
  'admin_adjustment',
] as const;
export const pointReasonSchema = z.enum(POINT_REASONS);
export type PointReason = z.infer<typeof pointReasonSchema>;

/** Notification channels. */
export const NOTIFICATION_CHANNELS = ['in_app', 'email'] as const;
export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

/** Notification categories, each independently opt-out-able. */
export const NOTIFICATION_TYPES = [
  'progress_reminder',
  'new_resource',
  'new_quiz',
  'quiz_result',
  'badge_earned',
  'announcement',
  'account_approved',
  'account_rejected',
] as const;
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** Drive access strategy. Service accounts can no longer own Drive files. */
export const DRIVE_MODES = ['oauth_user', 'shared_drive'] as const;
export const driveModeSchema = z.enum(DRIVE_MODES);
export type DriveMode = z.infer<typeof driveModeSchema>;

/** Outcome of a Drive synchronisation run. */
export const SYNC_STATUSES = ['pending', 'running', 'succeeded', 'failed', 'partial'] as const;
export const syncStatusSchema = z.enum(SYNC_STATUSES);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

/** AI feature identifiers. Adding a feature means adding a member here. */
export const AI_FEATURES = [
  'tutor',
  'summarize',
  'quiz_generate',
  'flashcards',
  'translate',
  'explain_answer',
  'study_plan',
  'semantic_search',
  'metadata_propose',
  'ocr',
  'moderate',
  'admin_digest',
] as const;
export const aiFeatureSchema = z.enum(AI_FEATURES);
export type AiFeature = z.infer<typeof aiFeatureSchema>;

/**
 * Model intent aliases. Application code asks for an intent, never a vendor model
 * string, so swapping providers is a configuration change.
 */
export const AI_MODEL_INTENTS = ['fast', 'balanced', 'deep', 'vision', 'embed', 'free'] as const;
export const aiModelIntentSchema = z.enum(AI_MODEL_INTENTS);
export type AiModelIntent = z.infer<typeof aiModelIntentSchema>;

/** Provider namespaces registered in the AI router. */
export const AI_PROVIDERS = [
  'openrouter',
  'google',
  'openai',
  'anthropic',
  'groq',
  'compatible',
  'local',
] as const;
export const aiProviderSchema = z.enum(AI_PROVIDERS);
export type AiProvider = z.infer<typeof aiProviderSchema>;

/** Router selection strategies. */
export const AI_ROUTING_STRATEGIES = [
  'priority',
  'cost_optimized',
  'latency_optimized',
  'quality_first',
  'round_robin',
  'weighted',
  'capability_match',
  'free_first',
  'sticky_session',
] as const;
export const aiRoutingStrategySchema = z.enum(AI_ROUTING_STRATEGIES);
export type AiRoutingStrategy = z.infer<typeof aiRoutingStrategySchema>;
