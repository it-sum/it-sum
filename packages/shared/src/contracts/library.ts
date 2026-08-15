import { z } from 'zod';
import {
  batchLevelSchema,
  examPhaseSchema,
  materialKindSchema,
  publicationStateSchema,
  resourceTypeSchema,
  semesterTermSchema,
  textQualitySchema,
} from '../domain/enums.js';
import {
  bilingualRichTextSchema,
  countSchema,
  driveIdSchema,
  isoDateTimeSchema,
  md5Schema,
  paginationQuerySchema,
  percentSchema,
  positiveIntSchema,
  uuidSchema,
  youtubeIdSchema,
} from '../domain/primitives.js';

/**
 * Library contract: folders, resources, videos and the faceted search that makes
 * the platform more useful than the Drive folder it replaces.
 *
 * A resource is metadata *about* a file, never the bytes. Bytes are streamed
 * separately through an authorised proxy endpoint, which is what keeps Drive
 * credentials server-side and lets us support range requests and caching.
 */

/** Person credited with producing a document, e.g. "Eng: Ahmed Eid". */
export const contributorSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(160),
  normalized: z.string().min(1).max(160),
  title: z.string().max(80).nullable(),
  resourceCount: countSchema.optional(),
});
export type Contributor = z.infer<typeof contributorSchema>;

/** A folder node, mirroring Drive's hierarchy for breadcrumb navigation. */
export const folderSchema = z.object({
  id: uuidSchema,
  parentId: uuidSchema.nullable(),
  courseId: uuidSchema.nullable(),
  driveFolderId: driveIdSchema.nullable(),
  name: z.string().min(1).max(300),
  displayName: z.string().min(1).max(300),
  path: z.string().max(2000),
  depth: z.number().int().min(0).max(12),
  materialKind: materialKindSchema.nullable(),
  examPhase: examPhaseSchema.nullable(),
  resourceCount: countSchema,
  childFolderCount: countSchema,
});
export type Folder = z.infer<typeof folderSchema>;

/** A single ancestor entry in a breadcrumb trail. */
export const breadcrumbSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  kind: z.enum(['department', 'batch', 'semester', 'course', 'folder']),
});
export type Breadcrumb = z.infer<typeof breadcrumbSchema>;

/** Per-user reading state attached to a resource when a user is authenticated. */
export const resourceProgressSchema = z.object({
  percent: percentSchema,
  lastPage: positiveIntSchema.nullable(),
  lastSecond: z.number().min(0).nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  updatedAt: isoDateTimeSchema,
});
export type ResourceProgress = z.infer<typeof resourceProgressSchema>;

/**
 * A library item. `textQuality` is surfaced to the client so the UI can honestly
 * label a scanned document as not searchable instead of silently returning no
 * results for it.
 */
export const resourceSchema = z.object({
  id: uuidSchema,
  courseId: uuidSchema.nullable(),
  folderId: uuidSchema.nullable(),
  type: resourceTypeSchema,
  title: z.string().min(1).max(400),
  displayTitle: z.string().min(1).max(400),
  description: bilingualRichTextSchema,
  materialKind: materialKindSchema,
  examPhase: examPhaseSchema,
  contributors: z.array(contributorSchema),
  driveFileId: driveIdSchema.nullable(),
  youtubeId: youtubeIdSchema.nullable(),
  mimeType: z.string().max(160).nullable(),
  sizeBytes: countSchema.nullable(),
  pageCount: positiveIntSchema.nullable(),
  durationSeconds: positiveIntSchema.nullable(),
  thumbnailUrl: z.string().url().nullable(),
  md5: md5Schema.nullable(),
  textQuality: textQualitySchema,
  isSearchable: z.boolean(),
  isAiReady: z.boolean(),
  downloadAllowed: z.boolean(),
  state: publicationStateSchema,
  tags: z.array(z.string().max(60)),
  viewCount: countSchema,
  publishedAt: isoDateTimeSchema.nullable(),
  driveModifiedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  progress: resourceProgressSchema.nullable(),
  isBookmarked: z.boolean(),
});
export type Resource = z.infer<typeof resourceSchema>;

/** Lightweight projection used in dense grids and search results. */
export const resourceSummarySchema = resourceSchema.pick({
  id: true,
  courseId: true,
  type: true,
  displayTitle: true,
  materialKind: true,
  examPhase: true,
  sizeBytes: true,
  pageCount: true,
  durationSeconds: true,
  thumbnailUrl: true,
  textQuality: true,
  isSearchable: true,
  downloadAllowed: true,
  state: true,
  progress: true,
  isBookmarked: true,
  publishedAt: true,
});
export type ResourceSummary = z.infer<typeof resourceSummarySchema>;

/**
 * Library query. Every facet is optional and combinable; the server translates
 * this into one indexed SQL query rather than a chain of client-side filters.
 */
export const libraryQuerySchema = paginationQuerySchema.extend({
  departmentId: uuidSchema.optional(),
  batchLevel: batchLevelSchema.optional(),
  semesterTerm: semesterTermSchema.optional(),
  courseId: uuidSchema.optional(),
  folderId: uuidSchema.optional(),
  materialKind: materialKindSchema.optional(),
  examPhase: examPhaseSchema.optional(),
  contributorId: uuidSchema.optional(),
  type: resourceTypeSchema.optional(),
  search: z.string().max(200).optional(),
  onlySearchable: z.coerce.boolean().optional(),
  onlyBookmarked: z.coerce.boolean().optional(),
  onlyIncomplete: z.coerce.boolean().optional(),
  newSince: isoDateTimeSchema.optional(),
  sort: z.enum(['recent', 'title', 'size', 'popular', 'progress']).default('recent'),
});
export type LibraryQuery = z.infer<typeof libraryQuerySchema>;

/** One facet value with its result count, so the UI can grey out empty filters. */
export const facetBucketSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: countSchema,
});
export type FacetBucket = z.infer<typeof facetBucketSchema>;

export const libraryFacetsSchema = z.object({
  materialKinds: z.array(facetBucketSchema),
  examPhases: z.array(facetBucketSchema),
  contributors: z.array(facetBucketSchema),
  types: z.array(facetBucketSchema),
  courses: z.array(facetBucketSchema),
});
export type LibraryFacets = z.infer<typeof libraryFacetsSchema>;

/** Library response: items, facets and breadcrumbs in a single round trip. */
export const libraryResponseSchema = z.object({
  items: z.array(resourceSummarySchema),
  folders: z.array(folderSchema),
  breadcrumbs: z.array(breadcrumbSchema),
  facets: libraryFacetsSchema,
  nextCursor: z.string().nullable(),
  total: countSchema,
});
export type LibraryResponse = z.infer<typeof libraryResponseSchema>;

/** Short-lived, signed descriptor the viewer uses to stream bytes. */
export const streamTicketSchema = z.object({
  url: z.string().min(1),
  expiresAt: isoDateTimeSchema,
  sizeBytes: countSchema.nullable(),
  mimeType: z.string(),
  supportsRange: z.boolean(),
});
export type StreamTicket = z.infer<typeof streamTicketSchema>;

export const videoSchema = z.object({
  id: uuidSchema,
  resourceId: uuidSchema,
  courseId: uuidSchema.nullable(),
  youtubeId: youtubeIdSchema,
  title: z.string().min(1).max(400),
  description: bilingualRichTextSchema,
  durationSeconds: positiveIntSchema.nullable(),
  thumbnailUrl: z.string().url().nullable(),
  channelTitle: z.string().max(200).nullable(),
  isEmbeddable: z.boolean(),
  state: publicationStateSchema,
  progress: resourceProgressSchema.nullable(),
  publishedAt: isoDateTimeSchema.nullable(),
});
export type Video = z.infer<typeof videoSchema>;

export const bookmarkSchema = z.object({
  id: uuidSchema,
  resourceId: uuidSchema,
  note: z.string().max(1000).nullable(),
  page: positiveIntSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkRequestSchema = z.object({
  resourceId: uuidSchema,
  note: z.string().max(1000).optional(),
  page: positiveIntSchema.optional(),
});
export type CreateBookmarkRequest = z.infer<typeof createBookmarkRequestSchema>;

export const updateResourceRequestSchema = z.object({
  displayTitle: z.string().min(1).max(400).optional(),
  description: bilingualRichTextSchema.optional(),
  courseId: uuidSchema.nullable().optional(),
  materialKind: materialKindSchema.optional(),
  examPhase: examPhaseSchema.optional(),
  contributorIds: z.array(uuidSchema).optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
  downloadAllowed: z.boolean().optional(),
  state: publicationStateSchema.optional(),
});
export type UpdateResourceRequest = z.infer<typeof updateResourceRequestSchema>;

/** Bulk administrative action over selected resources. */
export const bulkResourceActionSchema = z.object({
  resourceIds: z.array(uuidSchema).min(1).max(500),
  action: z.enum(['publish', 'unpublish', 'archive', 'allow_download', 'deny_download', 'delete']),
  reason: z.string().max(500).optional(),
});
export type BulkResourceAction = z.infer<typeof bulkResourceActionSchema>;
