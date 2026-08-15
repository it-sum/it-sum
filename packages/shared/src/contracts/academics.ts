import { z } from 'zod';
import { batchLevelSchema, semesterTermSchema } from '../domain/enums.js';
import {
  bilingualRichTextSchema,
  bilingualTextSchema,
  countSchema,
  driveIdSchema,
  isoDateTimeSchema,
  slugSchema,
  uuidSchema,
} from '../domain/primitives.js';

/**
 * Academic structure contract: university, department, batch, semester, course.
 *
 * The shape mirrors the real Drive tree but is deliberately normalised. Folder
 * names in the source data are inconsistent (`physics` and `physic`,
 * `Cybersecurity` and `Cyber Security`, trailing spaces, emoji), so a canonical
 * course record owns the truth and `courseAliasSchema` absorbs every observed
 * spelling. Without this, an importer silently creates duplicate courses.
 */

export const universitySchema = z.object({
  id: uuidSchema,
  slug: slugSchema,
  name: bilingualTextSchema,
  shortName: bilingualTextSchema,
  logoUrl: z.string().url().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Expected a hex colour such as #1BA9A2')
    .nullable(),
  emailDomains: z.array(z.string().min(3).max(120)),
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
});
export type University = z.infer<typeof universitySchema>;

export const departmentSchema = z.object({
  id: uuidSchema,
  universityId: uuidSchema,
  slug: slugSchema,
  name: bilingualTextSchema,
  description: bilingualRichTextSchema,
  iconName: z.string().max(60).nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  courseCount: countSchema.optional(),
  resourceCount: countSchema.optional(),
});
export type Department = z.infer<typeof departmentSchema>;

export const batchSchema = z.object({
  id: uuidSchema,
  departmentId: uuidSchema,
  level: batchLevelSchema,
  name: bilingualTextSchema,
  driveFolderId: driveIdSchema.nullable(),
  isActive: z.boolean(),
  semesterCount: countSchema.optional(),
  resourceCount: countSchema.optional(),
});
export type Batch = z.infer<typeof batchSchema>;

export const semesterSchema = z.object({
  id: uuidSchema,
  batchId: uuidSchema,
  term: semesterTermSchema,
  name: bilingualTextSchema,
  driveFolderId: driveIdSchema.nullable(),
  isActive: z.boolean(),
  courseCount: countSchema.optional(),
  resourceCount: countSchema.optional(),
});
export type Semester = z.infer<typeof semesterSchema>;

export const courseSchema = z.object({
  id: uuidSchema,
  semesterId: uuidSchema,
  slug: slugSchema,
  code: z.string().max(40).nullable(),
  name: bilingualTextSchema,
  description: bilingualRichTextSchema,
  instructorName: z.string().max(160).nullable(),
  creditHours: z.number().int().min(0).max(12).nullable(),
  coverImageUrl: z.string().url().nullable(),
  driveFolderId: driveIdSchema.nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  resourceCount: countSchema.optional(),
  videoCount: countSchema.optional(),
  quizCount: countSchema.optional(),
});
export type Course = z.infer<typeof courseSchema>;

/**
 * An observed alternative spelling for a course. `confidence` records how the
 * mapping was established so an administrator can review low-confidence guesses
 * rather than discovering a mis-filed document weeks later.
 */
export const courseAliasSchema = z.object({
  id: uuidSchema,
  courseId: uuidSchema,
  alias: z.string().min(1).max(200),
  normalized: z.string().min(1).max(200),
  source: z.enum(['manual', 'drive_folder', 'importer_fuzzy', 'ai_proposal']),
  confidence: z.number().min(0).max(1),
  createdAt: isoDateTimeSchema,
});
export type CourseAlias = z.infer<typeof courseAliasSchema>;

/** A full department subtree, used to render the departments page in one request. */
export const departmentTreeSchema = departmentSchema.extend({
  batches: z.array(
    batchSchema.extend({
      semesters: z.array(
        semesterSchema.extend({
          courses: z.array(courseSchema),
        }),
      ),
    }),
  ),
});
export type DepartmentTree = z.infer<typeof departmentTreeSchema>;

export const createDepartmentRequestSchema = z.object({
  slug: slugSchema,
  name: bilingualTextSchema,
  description: bilingualRichTextSchema.optional(),
  iconName: z.string().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateDepartmentRequest = z.infer<typeof createDepartmentRequestSchema>;

export const updateDepartmentRequestSchema = createDepartmentRequestSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateDepartmentRequest = z.infer<typeof updateDepartmentRequestSchema>;

export const createBatchRequestSchema = z.object({
  departmentId: uuidSchema,
  level: batchLevelSchema,
  name: bilingualTextSchema,
  driveFolderId: driveIdSchema.nullable().optional(),
});
export type CreateBatchRequest = z.infer<typeof createBatchRequestSchema>;

export const createSemesterRequestSchema = z.object({
  batchId: uuidSchema,
  term: semesterTermSchema,
  name: bilingualTextSchema,
  driveFolderId: driveIdSchema.nullable().optional(),
});
export type CreateSemesterRequest = z.infer<typeof createSemesterRequestSchema>;

export const createCourseRequestSchema = z.object({
  semesterId: uuidSchema,
  slug: slugSchema,
  code: z.string().max(40).nullable().optional(),
  name: bilingualTextSchema,
  description: bilingualRichTextSchema.optional(),
  instructorName: z.string().max(160).nullable().optional(),
  creditHours: z.number().int().min(0).max(12).nullable().optional(),
  driveFolderId: driveIdSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateCourseRequest = z.infer<typeof createCourseRequestSchema>;

export const updateCourseRequestSchema = createCourseRequestSchema
  .omit({ semesterId: true })
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateCourseRequest = z.infer<typeof updateCourseRequestSchema>;

export const createCourseAliasRequestSchema = z.object({
  courseId: uuidSchema,
  alias: z.string().min(1).max(200),
});
export type CreateCourseAliasRequest = z.infer<typeof createCourseAliasRequestSchema>;
