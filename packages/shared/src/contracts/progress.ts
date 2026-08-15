import { z } from 'zod';
import {
  countSchema,
  idempotencyKeySchema,
  isoDateTimeSchema,
  percentSchema,
  positiveIntSchema,
  uuidSchema,
} from '../domain/primitives';
import { resourceSummarySchema } from './library';

/**
 * Progress contract.
 *
 * Two design points matter here. First, every write carries an idempotency key
 * because the client debounces and also fires a final beacon on unload, so the
 * same position can legitimately arrive twice. Second, the client sends observed
 * playback position *and* the wall-clock window it was observed over, letting the
 * server reject physically impossible jumps rather than trusting the browser.
 */

export const progressUpdateRequestSchema = z
  .object({
    resourceId: uuidSchema,
    percent: percentSchema,
    lastPage: positiveIntSchema.nullable().optional(),
    lastSecond: z.number().min(0).nullable().optional(),
    /** Seconds of real time the client observed since its previous report. */
    elapsedSeconds: z.number().min(0).max(86_400).optional(),
    idempotencyKey: idempotencyKeySchema,
  })
  .refine((value) => value.lastPage != null || value.lastSecond != null, {
    message: 'A progress update must include either lastPage (documents) or lastSecond (video)',
  });
export type ProgressUpdateRequest = z.infer<typeof progressUpdateRequestSchema>;

export const progressUpdateResponseSchema = z.object({
  resourceId: uuidSchema,
  percent: percentSchema,
  lastPage: positiveIntSchema.nullable(),
  lastSecond: z.number().min(0).nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  /** True when the server clamped a suspicious client-reported jump. */
  adjusted: z.boolean(),
  pointsAwarded: countSchema,
});
export type ProgressUpdateResponse = z.infer<typeof progressUpdateResponseSchema>;

/** A "continue where you left off" entry for the dashboard. */
export const continueItemSchema = z.object({
  resource: resourceSummarySchema,
  courseName: z.string(),
  percent: percentSchema,
  lastPage: positiveIntSchema.nullable(),
  lastSecond: z.number().min(0).nullable(),
  lastSeenAt: isoDateTimeSchema,
  /** Deep link that resumes at the exact page or second. */
  resumeHref: z.string(),
});
export type ContinueItem = z.infer<typeof continueItemSchema>;

export const courseProgressSchema = z.object({
  courseId: uuidSchema,
  courseName: z.string(),
  totalResources: countSchema,
  completedResources: countSchema,
  inProgressResources: countSchema,
  percent: percentSchema,
  totalQuizzes: countSchema,
  passedQuizzes: countSchema,
  lastActivityAt: isoDateTimeSchema.nullable(),
});
export type CourseProgress = z.infer<typeof courseProgressSchema>;

export const streakSchema = z.object({
  currentDays: countSchema,
  longestDays: countSchema,
  lastActiveDate: z.string().date().nullable(),
  /** Seven booleans, oldest first, for the week strip in the UI. */
  weekActivity: z.array(z.boolean()).length(7),
});
export type Streak = z.infer<typeof streakSchema>;

/** Daily activity point for the progress chart. */
export const activityPointSchema = z.object({
  date: z.string().date(),
  minutesStudied: countSchema,
  resourcesOpened: countSchema,
  quizzesTaken: countSchema,
});
export type ActivityPoint = z.infer<typeof activityPointSchema>;

export const progressOverviewSchema = z.object({
  continueItems: z.array(continueItemSchema),
  courses: z.array(courseProgressSchema),
  streak: streakSchema,
  activity: z.array(activityPointSchema),
  totals: z.object({
    resourcesCompleted: countSchema,
    videosCompleted: countSchema,
    quizzesPassed: countSchema,
    minutesStudied: countSchema,
    points: countSchema,
  }),
});
export type ProgressOverview = z.infer<typeof progressOverviewSchema>;
