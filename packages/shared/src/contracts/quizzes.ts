import { z } from 'zod';
import {
  attemptStatusSchema,
  examPhaseSchema,
  publicationStateSchema,
  questionTypeSchema,
} from '../domain/enums';
import {
  bilingualRichTextSchema,
  countSchema,
  isoDateTimeSchema,
  paginationQuerySchema,
  percentSchema,
  positiveIntSchema,
  uuidSchema,
} from '../domain/primitives';

/**
 * Quiz contract.
 *
 * The single most important property expressed here is the split between
 * `quizOptionSchema` (what a student receives) and `quizOptionWithKeySchema`
 * (what an administrator receives). The student-facing option type has no field
 * that could reveal the answer, so a leak cannot happen by accident — it would
 * require changing the type and failing review.
 *
 * The second property is versioning: an attempt references a `quizVersionId`, so
 * editing a quiz afterwards can never retroactively change a recorded score.
 */

/** An answer option as delivered to a student: deliberately key-free. */
export const quizOptionSchema = z.object({
  id: uuidSchema,
  text: z.string().min(1).max(2000),
  imageUrl: z.string().url().nullable(),
  sortOrder: z.number().int().min(0),
});
export type QuizOption = z.infer<typeof quizOptionSchema>;

/** An answer option including the key. Admin-only; never sent pre-submission. */
export const quizOptionWithKeySchema = quizOptionSchema.extend({
  isCorrect: z.boolean(),
  explanation: z.string().max(2000).nullable(),
});
export type QuizOptionWithKey = z.infer<typeof quizOptionWithKeySchema>;

/** A question as delivered to a student. */
export const quizQuestionSchema = z.object({
  id: uuidSchema,
  type: questionTypeSchema,
  prompt: z.string().min(1).max(4000),
  imageUrl: z.string().url().nullable(),
  points: positiveIntSchema,
  sortOrder: z.number().int().min(0),
  /** Present for choice questions; absent for short answers. */
  options: z.array(quizOptionSchema),
  /** How many options must be selected, for multiple-choice questions. */
  requiredSelections: positiveIntSchema.nullable(),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/** A question including answer keys. Admin-only. */
export const quizQuestionWithKeySchema = quizQuestionSchema.extend({
  options: z.array(quizOptionWithKeySchema),
  correctShortAnswers: z.array(z.string().max(500)),
  explanation: z.string().max(4000).nullable(),
});
export type QuizQuestionWithKey = z.infer<typeof quizQuestionWithKeySchema>;

export const quizSchema = z.object({
  id: uuidSchema,
  courseId: uuidSchema,
  resourceId: uuidSchema.nullable(),
  title: z.string().min(1).max(300),
  description: bilingualRichTextSchema,
  examPhase: examPhaseSchema,
  state: publicationStateSchema,
  publishedVersionId: uuidSchema.nullable(),
  questionCount: countSchema,
  totalPoints: countSchema,
  timeLimitSeconds: positiveIntSchema.nullable(),
  passPercent: percentSchema,
  maxAttempts: positiveIntSchema.nullable(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  showAnswersAfterSubmit: z.boolean(),
  /** True when the quiz was drafted by AI and still needs human approval. */
  isAiGenerated: z.boolean(),
  aiReviewRequired: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type Quiz = z.infer<typeof quizSchema>;

/** Student-facing quiz card with their own attempt history summarised. */
export const quizSummarySchema = quizSchema
  .pick({
    id: true,
    courseId: true,
    title: true,
    examPhase: true,
    questionCount: true,
    totalPoints: true,
    timeLimitSeconds: true,
    passPercent: true,
    maxAttempts: true,
    isAiGenerated: true,
  })
  .extend({
    courseName: z.string(),
    attemptsUsed: countSchema,
    bestPercent: percentSchema.nullable(),
    lastAttemptAt: isoDateTimeSchema.nullable(),
    isPassed: z.boolean(),
  });
export type QuizSummary = z.infer<typeof quizSummarySchema>;

/** The payload that starts an attempt. Contains no answer keys by construction. */
export const startAttemptResponseSchema = z.object({
  attemptId: uuidSchema,
  quizId: uuidSchema,
  quizVersionId: uuidSchema,
  /** Opaque token that must accompany submission; prevents replay and duplicates. */
  attemptToken: z.string().min(20),
  title: z.string(),
  questions: z.array(quizQuestionSchema),
  totalPoints: countSchema,
  timeLimitSeconds: positiveIntSchema.nullable(),
  expiresAt: isoDateTimeSchema.nullable(),
  startedAt: isoDateTimeSchema,
  /** Answers already autosaved, so a refresh mid-quiz loses nothing. */
  savedAnswers: z.record(z.array(z.string())),
});
export type StartAttemptResponse = z.infer<typeof startAttemptResponseSchema>;

/** One answer: option ids for choice questions, free text for short answers. */
export const answerInputSchema = z.object({
  questionId: uuidSchema,
  optionIds: z.array(uuidSchema).max(10).default([]),
  text: z.string().max(2000).nullable().default(null),
});
export type AnswerInput = z.infer<typeof answerInputSchema>;

export const autosaveAnswersRequestSchema = z.object({
  attemptToken: z.string().min(20),
  answers: z.array(answerInputSchema).max(200),
});
export type AutosaveAnswersRequest = z.infer<typeof autosaveAnswersRequestSchema>;

export const submitAttemptRequestSchema = z.object({
  attemptToken: z.string().min(20),
  answers: z.array(answerInputSchema).max(200),
});
export type SubmitAttemptRequest = z.infer<typeof submitAttemptRequestSchema>;

/** Per-question outcome, revealed only after submission. */
export const answerResultSchema = z.object({
  questionId: uuidSchema,
  isCorrect: z.boolean(),
  pointsEarned: countSchema,
  pointsPossible: countSchema,
  selectedOptionIds: z.array(uuidSchema),
  correctOptionIds: z.array(uuidSchema),
  correctShortAnswers: z.array(z.string()),
  explanation: z.string().nullable(),
});
export type AnswerResult = z.infer<typeof answerResultSchema>;

export const attemptResultSchema = z.object({
  attemptId: uuidSchema,
  quizId: uuidSchema,
  quizVersionId: uuidSchema,
  status: attemptStatusSchema,
  score: countSchema,
  totalPoints: countSchema,
  percent: percentSchema,
  isPassed: z.boolean(),
  durationSeconds: countSchema,
  submittedAt: isoDateTimeSchema,
  pointsAwarded: countSchema,
  newBadges: z.array(z.string()),
  /** Populated only when the quiz allows post-submission review. */
  answers: z.array(answerResultSchema),
});
export type AttemptResult = z.infer<typeof attemptResultSchema>;

export const attemptHistoryItemSchema = z.object({
  attemptId: uuidSchema,
  quizId: uuidSchema,
  quizTitle: z.string(),
  courseName: z.string(),
  percent: percentSchema,
  score: countSchema,
  totalPoints: countSchema,
  isPassed: z.boolean(),
  status: attemptStatusSchema,
  submittedAt: isoDateTimeSchema.nullable(),
});
export type AttemptHistoryItem = z.infer<typeof attemptHistoryItemSchema>;

export const quizListQuerySchema = paginationQuerySchema.extend({
  courseId: uuidSchema.optional(),
  examPhase: examPhaseSchema.optional(),
  onlyUnattempted: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
});
export type QuizListQuery = z.infer<typeof quizListQuerySchema>;

/** Admin authoring payloads. */
export const upsertQuizOptionSchema = z.object({
  id: uuidSchema.optional(),
  text: z.string().min(1).max(2000),
  isCorrect: z.boolean(),
  explanation: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().min(0),
});

export const upsertQuizQuestionSchema = z
  .object({
    id: uuidSchema.optional(),
    type: questionTypeSchema,
    prompt: z.string().min(1).max(4000),
    points: positiveIntSchema.default(1),
    sortOrder: z.number().int().min(0),
    options: z.array(upsertQuizOptionSchema).max(10).default([]),
    correctShortAnswers: z.array(z.string().max(500)).max(10).default([]),
    explanation: z.string().max(4000).nullable().optional(),
  })
  .superRefine((question, ctx) => {
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    if (question.type === 'short_answer') {
      if (question.correctShortAnswers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A short-answer question needs at least one accepted answer',
          path: ['correctShortAnswers'],
        });
      }
      return;
    }

    if (question.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A choice question needs at least two options',
        path: ['options'],
      });
    }
    if (correctCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A choice question needs at least one correct option',
        path: ['options'],
      });
    }
    if (question.type === 'single_choice' && correctCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A single-choice question cannot have more than one correct option',
        path: ['options'],
      });
    }
    if (question.type === 'true_false' && question.options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A true/false question must have exactly two options',
        path: ['options'],
      });
    }
  });
export type UpsertQuizQuestion = z.infer<typeof upsertQuizQuestionSchema>;

export const upsertQuizRequestSchema = z.object({
  courseId: uuidSchema,
  resourceId: uuidSchema.nullable().optional(),
  title: z.string().min(1).max(300),
  description: bilingualRichTextSchema.optional(),
  examPhase: examPhaseSchema.default('unphased'),
  timeLimitSeconds: positiveIntSchema.nullable().optional(),
  passPercent: percentSchema.default(60),
  maxAttempts: positiveIntSchema.nullable().optional(),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  showAnswersAfterSubmit: z.boolean().default(true),
  questions: z.array(upsertQuizQuestionSchema).min(1).max(200),
});
export type UpsertQuizRequest = z.infer<typeof upsertQuizRequestSchema>;

/** Import payload accepted from Drive JSON/CSV. */
export const quizImportRequestSchema = z.object({
  courseId: uuidSchema,
  driveFileId: z.string().min(10).optional(),
  format: z.enum(['json', 'csv']),
  content: z.string().min(1).max(2_000_000).optional(),
  dryRun: z.boolean().default(true),
});
export type QuizImportRequest = z.infer<typeof quizImportRequestSchema>;

export const quizImportResultSchema = z.object({
  parsedQuestions: countSchema,
  validQuestions: countSchema,
  errors: z.array(
    z.object({
      row: z.number().int().min(0),
      field: z.string(),
      message: z.string(),
    }),
  ),
  duplicateIds: z.array(z.string()),
  quizId: uuidSchema.nullable(),
});
export type QuizImportResult = z.infer<typeof quizImportResultSchema>;
