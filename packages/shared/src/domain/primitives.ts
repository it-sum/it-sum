import { z } from 'zod';
import { localeSchema } from './enums.js';

/**
 * Reusable primitive schemas.
 *
 * Every boundary in the system validates with these, so a malformed identifier or
 * an unbounded page size is rejected in one place rather than being defended
 * against repeatedly in handlers.
 */

/** A UUID primary key as issued by Postgres `gen_random_uuid()`. */
export const uuidSchema = z.string().uuid();

/** A Google Drive file or folder identifier. */
export const driveIdSchema = z
  .string()
  .min(10)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/, 'Not a valid Google Drive id');

/** A YouTube video identifier. */
export const youtubeIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{11}$/, 'Not a valid YouTube video id');

/** An MD5 checksum as returned by the Drive API. */
export const md5Schema = z.string().regex(/^[a-f0-9]{32}$/i, 'Not a valid MD5 checksum');

/** ISO-8601 timestamp, always stored and transported in UTC. */
export const isoDateTimeSchema = z.string().datetime({ offset: true });

/** A URL-safe slug. */
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slugs are lowercase alphanumeric words joined by hyphens');

/** Email address, normalised to lowercase so uniqueness is case-insensitive. */
export const emailSchema = z
  .string()
  .email()
  .max(320)
  .transform((value) => value.trim().toLowerCase());

/**
 * Password policy. Long enough to resist offline attack while remaining typable
 * on a phone keyboard, which is how most students will register.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a digit');

/** A percentage from 0 to 100 with at most two decimal places. */
export const percentSchema = z.number().min(0).max(100);

/** A non-negative integer count. */
export const countSchema = z.number().int().min(0);

/** Positive integer, used for page numbers and durations. */
export const positiveIntSchema = z.number().int().positive();

/**
 * Bilingual text. Arabic is required because it is the default locale; English is
 * optional so content can be added Arabic-first and translated later.
 */
export const bilingualTextSchema = z.object({
  ar: z.string().min(1).max(500),
  en: z.string().min(1).max(500).nullable(),
});
export type BilingualText = z.infer<typeof bilingualTextSchema>;

/** Optional bilingual long-form text, used for descriptions. */
export const bilingualRichTextSchema = z.object({
  ar: z.string().max(5000).nullable(),
  en: z.string().max(5000).nullable(),
});
export type BilingualRichText = z.infer<typeof bilingualRichTextSchema>;

/**
 * Cursor pagination. Chosen over offset pagination because the library is
 * append-heavy: offsets shift under the reader as content is imported.
 */
export const paginationQuerySchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Sort direction. */
export const sortDirectionSchema = z.enum(['asc', 'desc']).default('desc');

/** Wraps any item schema in a cursor-paginated envelope. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    total: countSchema.nullable(),
  });

/** A localisable, machine-readable API error. */
export const apiErrorSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  code: z.string().min(1).max(80),
  message: z.string().min(1),
  details: z.record(z.unknown()).nullable().optional(),
  correlationId: z.string().min(1).nullable().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Locale query parameter shared by endpoints that return localisable copy. */
export const localeQuerySchema = z.object({
  locale: localeSchema.optional(),
});

/**
 * Idempotency key supplied by clients on mutations that must never double-apply,
 * notably progress writes and reward grants.
 */
export const idempotencyKeySchema = z.string().min(8).max(200);
