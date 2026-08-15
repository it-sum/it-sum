import { z } from 'zod';
import {
  aiFeatureSchema,
  aiModelIntentSchema,
  aiProviderSchema,
  aiRoutingStrategySchema,
  localeSchema,
} from '../domain/enums.js';
import {
  countSchema,
  isoDateTimeSchema,
  paginationQuerySchema,
  positiveIntSchema,
  uuidSchema,
} from '../domain/primitives.js';

/**
 * AI router contract.
 *
 * The whole AI layer is optional and disabled by default. That is expressed here
 * rather than hidden in configuration: `aiCapabilitiesSchema` is what the client
 * fetches first, and when `enabled` is false the UI removes every AI affordance
 * instead of rendering buttons that fail. Requests name an *intent* (`fast`,
 * `deep`, `free`) rather than a vendor model, so switching providers never
 * requires touching application code.
 */

/** One model the router can reach, with the facts needed to choose it. */
export const aiModelDescriptorSchema = z.object({
  id: z.string().min(1).max(200),
  provider: aiProviderSchema,
  displayName: z.string().max(200),
  intents: z.array(aiModelIntentSchema),
  contextWindow: positiveIntSchema,
  maxOutputTokens: positiveIntSchema.nullable(),
  supportsStreaming: z.boolean(),
  supportsStructuredOutput: z.boolean(),
  supportsVision: z.boolean(),
  supportsReasoning: z.boolean(),
  inputCostPerMillion: z.number().min(0),
  outputCostPerMillion: z.number().min(0),
  isFree: z.boolean(),
  isAvailable: z.boolean(),
});
export type AiModelDescriptor = z.infer<typeof aiModelDescriptorSchema>;

/** Circuit-breaker state per provider, surfaced on the admin dashboard. */
export const aiProviderHealthSchema = z.object({
  provider: aiProviderSchema,
  state: z.enum(['closed', 'open', 'half_open']),
  isConfigured: z.boolean(),
  consecutiveFailures: countSchema,
  lastFailureAt: isoDateTimeSchema.nullable(),
  cooldownUntil: isoDateTimeSchema.nullable(),
  p95LatencyMs: countSchema.nullable(),
  successRate: z.number().min(0).max(1).nullable(),
});
export type AiProviderHealth = z.infer<typeof aiProviderHealthSchema>;

/** Remaining allowance for the caller, used to render budget meters. */
export const aiBudgetStatusSchema = z.object({
  scope: z.enum(['user', 'role', 'tenant', 'global']),
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  tokensUsed: countSchema,
  tokensLimit: countSchema.nullable(),
  costUsedUsd: z.number().min(0),
  costLimitUsd: z.number().min(0).nullable(),
  requestsUsed: countSchema,
  requestsLimit: countSchema.nullable(),
  isExhausted: z.boolean(),
});
export type AiBudgetStatus = z.infer<typeof aiBudgetStatusSchema>;

/**
 * What the client is allowed to show. A single request answers "is AI on, which
 * features, and how much budget do I have left" so the UI never guesses.
 */
export const aiCapabilitiesSchema = z.object({
  enabled: z.boolean(),
  features: z.array(
    z.object({
      feature: aiFeatureSchema,
      enabled: z.boolean(),
      requiresAdmin: z.boolean(),
      supportsStreaming: z.boolean(),
      description: z.string().max(300),
    }),
  ),
  budgets: z.array(aiBudgetStatusSchema),
  /** Present only for administrators. */
  models: z.array(aiModelDescriptorSchema).optional(),
  disabledReason: z.string().max(300).nullable(),
});
export type AiCapabilities = z.infer<typeof aiCapabilitiesSchema>;

/** Routing preferences a caller may express; all optional. */
export const aiRoutingHintSchema = z.object({
  intent: aiModelIntentSchema.optional(),
  strategy: aiRoutingStrategySchema.optional(),
  /** Force a specific provider. Administrators only; ignored for students. */
  provider: aiProviderSchema.optional(),
  maxCostUsd: z.number().min(0).max(5).optional(),
  allowCache: z.boolean().default(true),
});
export type AiRoutingHint = z.infer<typeof aiRoutingHintSchema>;

/** A source citation, always page-anchored so a student can verify the claim. */
export const aiCitationSchema = z.object({
  resourceId: uuidSchema,
  resourceTitle: z.string(),
  page: positiveIntSchema.nullable(),
  chunkId: uuidSchema,
  snippet: z.string().max(1000),
  score: z.number().min(0).max(1),
});
export type AiCitation = z.infer<typeof aiCitationSchema>;

/** Provenance recorded on every generated artefact, shown as an "AI" badge. */
export const aiProvenanceSchema = z.object({
  provider: aiProviderSchema,
  model: z.string(),
  intent: aiModelIntentSchema,
  strategy: aiRoutingStrategySchema,
  cached: z.boolean(),
  fallbackChain: z.array(z.string()),
  promptTokens: countSchema,
  completionTokens: countSchema,
  estimatedCostUsd: z.number().min(0),
  latencyMs: countSchema,
  generatedAt: isoDateTimeSchema,
});
export type AiProvenance = z.infer<typeof aiProvenanceSchema>;

/** Chat turn in a tutor conversation. */
export const aiMessageSchema = z.object({
  id: uuidSchema,
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  citations: z.array(aiCitationSchema),
  provenance: aiProvenanceSchema.nullable(),
  rating: z.enum(['up', 'down']).nullable(),
  createdAt: isoDateTimeSchema,
});
export type AiMessage = z.infer<typeof aiMessageSchema>;

export const aiConversationSchema = z.object({
  id: uuidSchema,
  feature: aiFeatureSchema,
  title: z.string().max(200),
  resourceId: uuidSchema.nullable(),
  courseId: uuidSchema.nullable(),
  locale: localeSchema,
  messageCount: countSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type AiConversation = z.infer<typeof aiConversationSchema>;

/** Grounded chat request. Scope narrows retrieval so answers stay on-syllabus. */
export const aiChatRequestSchema = z.object({
  conversationId: uuidSchema.nullable().optional(),
  message: z.string().min(1).max(4000),
  resourceId: uuidSchema.nullable().optional(),
  courseId: uuidSchema.nullable().optional(),
  locale: localeSchema.optional(),
  routing: aiRoutingHintSchema.optional(),
  stream: z.boolean().default(true),
});
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;

export const aiChatResponseSchema = z.object({
  conversationId: uuidSchema,
  message: aiMessageSchema,
  budgets: z.array(aiBudgetStatusSchema),
});
export type AiChatResponse = z.infer<typeof aiChatResponseSchema>;

/** One frame of the SSE stream. Typed so the client renders without guessing. */
export const aiStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start'), conversationId: uuidSchema, messageId: uuidSchema }),
  z.object({ type: z.literal('delta'), text: z.string() }),
  z.object({ type: z.literal('citations'), citations: z.array(aiCitationSchema) }),
  z.object({ type: z.literal('provenance'), provenance: aiProvenanceSchema }),
  z.object({ type: z.literal('done'), messageId: uuidSchema }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
]);
export type AiStreamEvent = z.infer<typeof aiStreamEventSchema>;

/** Uniform envelope for every non-chat feature, keyed by feature name. */
export const aiFeatureRequestSchema = z.object({
  input: z.record(z.unknown()),
  locale: localeSchema.optional(),
  routing: aiRoutingHintSchema.optional(),
});
export type AiFeatureRequest = z.infer<typeof aiFeatureRequestSchema>;

export const aiFeatureResponseSchema = z.object({
  feature: aiFeatureSchema,
  output: z.unknown(),
  citations: z.array(aiCitationSchema),
  provenance: aiProvenanceSchema,
  /** True when the result must be approved by a human before it is used. */
  requiresReview: z.boolean(),
  reviewId: uuidSchema.nullable(),
});
export type AiFeatureResponse = z.infer<typeof aiFeatureResponseSchema>;

/** Feature-specific payloads that the router validates before dispatch. */
export const aiSummarizeInputSchema = z.object({
  resourceId: uuidSchema,
  style: z.enum(['bullet', 'outline', 'exam_sheet', 'one_page']).default('exam_sheet'),
  maxWords: z.number().int().min(50).max(3000).default(600),
});
export type AiSummarizeInput = z.infer<typeof aiSummarizeInputSchema>;

export const aiFlashcardsInputSchema = z.object({
  resourceId: uuidSchema,
  count: z.number().int().min(3).max(50).default(15),
});
export type AiFlashcardsInput = z.infer<typeof aiFlashcardsInputSchema>;

export const aiFlashcardSchema = z.object({
  front: z.string().min(1).max(500),
  back: z.string().min(1).max(1500),
  page: positiveIntSchema.nullable(),
});
export type AiFlashcard = z.infer<typeof aiFlashcardSchema>;

export const aiQuizGenerateInputSchema = z.object({
  resourceId: uuidSchema,
  courseId: uuidSchema,
  questionCount: z.number().int().min(3).max(40).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  questionTypes: z
    .array(z.enum(['single_choice', 'multiple_choice', 'true_false']))
    .min(1)
    .default(['single_choice']),
});
export type AiQuizGenerateInput = z.infer<typeof aiQuizGenerateInputSchema>;

export const aiStudyPlanInputSchema = z.object({
  courseIds: z.array(uuidSchema).min(1).max(12),
  examDate: z.string().date(),
  minutesPerDay: z.number().int().min(15).max(600).default(120),
});
export type AiStudyPlanInput = z.infer<typeof aiStudyPlanInputSchema>;

export const aiStudyPlanDaySchema = z.object({
  date: z.string().date(),
  totalMinutes: countSchema,
  items: z.array(
    z.object({
      resourceId: uuidSchema.nullable(),
      title: z.string(),
      activity: z.enum(['read', 'watch', 'quiz', 'review']),
      minutes: positiveIntSchema,
    }),
  ),
});
export type AiStudyPlanDay = z.infer<typeof aiStudyPlanDaySchema>;

export const aiTranslateInputSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLocale: localeSchema,
  glossaryMode: z.boolean().default(true),
});
export type AiTranslateInput = z.infer<typeof aiTranslateInputSchema>;

export const aiExplainAnswerInputSchema = z.object({
  attemptId: uuidSchema,
  questionId: uuidSchema,
});
export type AiExplainAnswerInput = z.infer<typeof aiExplainAnswerInputSchema>;

/** Usage metering, append-only, queried by the admin dashboard. */
export const aiUsageEventSchema = z.object({
  id: uuidSchema,
  feature: aiFeatureSchema,
  provider: aiProviderSchema,
  model: z.string(),
  promptTokens: countSchema,
  completionTokens: countSchema,
  estimatedCostUsd: z.number().min(0),
  latencyMs: countSchema,
  cached: z.boolean(),
  status: z.enum(['success', 'error', 'budget_denied', 'rate_limited']),
  errorCode: z.string().max(80).nullable(),
  createdAt: isoDateTimeSchema,
});
export type AiUsageEvent = z.infer<typeof aiUsageEventSchema>;

export const aiUsageQuerySchema = paginationQuerySchema.extend({
  feature: aiFeatureSchema.optional(),
  provider: aiProviderSchema.optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
  onlyErrors: z.coerce.boolean().optional(),
});
export type AiUsageQuery = z.infer<typeof aiUsageQuerySchema>;

export const aiUsageSummarySchema = z.object({
  totalRequests: countSchema,
  totalTokens: countSchema,
  totalCostUsd: z.number().min(0),
  cacheHitRate: z.number().min(0).max(1),
  errorRate: z.number().min(0).max(1),
  byFeature: z.array(
    z.object({
      feature: aiFeatureSchema,
      requests: countSchema,
      tokens: countSchema,
      costUsd: z.number().min(0),
      p95LatencyMs: countSchema,
    }),
  ),
  byProvider: z.array(
    z.object({
      provider: aiProviderSchema,
      requests: countSchema,
      costUsd: z.number().min(0),
      errorRate: z.number().min(0).max(1),
    }),
  ),
});
export type AiUsageSummary = z.infer<typeof aiUsageSummarySchema>;

export const aiFeedbackRequestSchema = z.object({
  messageId: uuidSchema,
  rating: z.enum(['up', 'down']),
  comment: z.string().max(1000).optional(),
});
export type AiFeedbackRequest = z.infer<typeof aiFeedbackRequestSchema>;

/** Bring-your-own-key management. Values are write-only and encrypted at rest. */
export const aiProviderKeyRequestSchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().min(10).max(400),
  baseUrl: z.string().url().optional(),
  label: z.string().max(120).optional(),
});
export type AiProviderKeyRequest = z.infer<typeof aiProviderKeyRequestSchema>;

export const aiProviderKeySchema = z.object({
  id: uuidSchema,
  provider: aiProviderSchema,
  label: z.string().max(120).nullable(),
  /** Only the last four characters are ever returned. */
  maskedKey: z.string().max(20),
  baseUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  lastUsedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type AiProviderKey = z.infer<typeof aiProviderKeySchema>;
