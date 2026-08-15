import { z } from "zod";

export const RoleSchema = z.enum(["student", "admin", "owner"]);
export type Role = z.infer<typeof RoleSchema>;

export const TenantClaimsSchema = z.object({
  sub: z.string().uuid(),
  university_id: z.string().uuid(),
  role: RoleSchema,
  email: z.string().email().optional(),
});
export type TenantClaims = z.infer<typeof TenantClaimsSchema>;

export const ApiErrorSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  code: z.string().min(1),
  message: z.string().min(1),
  correlationId: z.string().min(1).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const ResourceStatusSchema = z.enum(["draft", "published", "unavailable", "archived"]);
export const ResourceVisibilitySchema = z.enum(["tenant", "public"]);
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  title: z.string().min(1),
  normalizedTitle: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().positive().nullable(),
  driveFileId: z.string().min(1),
  driveMd5: z.string().min(1).nullable(),
  modifiedAt: z.string().datetime().nullable(),
  status: ResourceStatusSchema,
  visibility: ResourceVisibilitySchema,
  downloadAllowed: z.boolean(),
  textQuality: z.number().min(0).max(1).nullable(),
  courseId: z.string().uuid().nullable(),
  contributorId: z.string().uuid().nullable(),
  materialKindId: z.string().uuid().nullable(),
  examPhaseId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const ResourceListQuerySchema = PaginationQuerySchema.extend({
  courseId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  materialKindId: z.string().uuid().optional(),
  examPhaseId: z.string().uuid().optional(),
  contributorId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});
export type ResourceListQuery = z.infer<typeof ResourceListQuerySchema>;

export const ResourceListResponseSchema = z.object({
  data: z.array(ResourceSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type ResourceListResponse = z.infer<typeof ResourceListResponseSchema>;

export const StreamTokenRequestSchema = z.object({
  resourceId: z.string().uuid(),
});
export type StreamTokenRequest = z.infer<typeof StreamTokenRequestSchema>;

export const StreamTokenResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().datetime(),
  url: z.string().url(),
});
export type StreamTokenResponse = z.infer<typeof StreamTokenResponseSchema>;

export const DriveOAuthStartResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string().min(1),
});
export type DriveOAuthStartResponse = z.infer<typeof DriveOAuthStartResponseSchema>;

export const DriveSyncResponseSchema = z.object({
  runId: z.string().uuid(),
  status: z.enum(["queued", "running", "completed", "failed"]),
  imported: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  unavailable: z.number().int().nonnegative(),
});
export type DriveSyncResponse = z.infer<typeof DriveSyncResponseSchema>;

export const AppConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]),
  port: z.number().int().positive(),
  apiPrefix: z.string().min(1),
  supabaseUrl: z.string().url(),
  supabaseJwksUrl: z.string().url(),
  driveMode: z.enum(["oauth_user", "shared_drive"]),
  streamTokenTtlSeconds: z.number().int().min(30).max(900),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

export const ContractVersion = "v1" as const;

export const LocaleSchema = z.enum(["ar", "en"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: RoleSchema,
  status: z.enum(["pending", "approved", "suspended"]),
  leaderboardVisibility: z.enum(["full", "initial", "anonymous", "hidden"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UserPreferencesSchema = z.object({
  userId: z.string().uuid(),
  locale: LocaleSchema,
  theme: z.enum(["light", "dark", "system"]),
  remindersEnabled: z.boolean(),
  aiEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UpdatePreferencesRequestSchema = z.object({
  locale: LocaleSchema.optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  remindersEnabled: z.boolean().optional(),
  aiEnabled: z.boolean().optional(),
});
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const BatchSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  departmentId: z.string().uuid(),
  name: z.string().min(1),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Batch = z.infer<typeof BatchSchema>;

export const SemesterSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  batchId: z.string().uuid(),
  name: z.string().min(1),
  number: z.number().int().min(1).max(2),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Semester = z.infer<typeof SemesterSchema>;

export const CourseSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  semesterId: z.string().uuid(),
  code: z.string().nullable(),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Course = z.infer<typeof CourseSchema>;

export const AcademicStructureResponseSchema = z.object({
  departments: z.array(DepartmentSchema),
  batches: z.array(BatchSchema),
  semesters: z.array(SemesterSchema),
  courses: z.array(CourseSchema),
});
export type AcademicStructureResponse = z.infer<typeof AcademicStructureResponseSchema>;

export const VideoSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  courseId: z.string().uuid().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  published: z.boolean(),
  provider: z.literal("youtube").nullable(),
  externalId: z.string().nullable(),
  sourceUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Video = z.infer<typeof VideoSchema>;

export const VideoListQuerySchema = PaginationQuerySchema.extend({
  courseId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});
export type VideoListQuery = z.infer<typeof VideoListQuerySchema>;

export const VideoListResponseSchema = z.object({
  data: z.array(VideoSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type VideoListResponse = z.infer<typeof VideoListResponseSchema>;

export const QuizOptionSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  label: z.string().min(1),
});
export type QuizOption = z.infer<typeof QuizOptionSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  prompt: z.string().min(1),
  explanation: z.string().nullable(),
  points: z.number().int().positive(),
  options: z.array(QuizOptionSchema),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSummarySchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  courseId: z.string().uuid().nullable(),
  title: z.string().min(1),
  status: z.enum(["draft", "review", "published", "archived"]),
  currentVersionId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type QuizSummary = z.infer<typeof QuizSummarySchema>;

export const QuizListQuerySchema = PaginationQuerySchema.extend({
  courseId: z.string().uuid().optional(),
});
export type QuizListQuery = z.infer<typeof QuizListQuerySchema>;

export const QuizListResponseSchema = z.object({
  data: z.array(QuizSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type QuizListResponse = z.infer<typeof QuizListResponseSchema>;

export const QuizDetailResponseSchema = QuizSummarySchema.extend({
  questions: z.array(QuizQuestionSchema),
});
export type QuizDetailResponse = z.infer<typeof QuizDetailResponseSchema>;

export const StartQuizAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  quizId: z.string().uuid(),
  quizVersionId: z.string().uuid(),
  status: z.literal("in_progress"),
  createdAt: z.string().datetime(),
});
export type StartQuizAttemptResponse = z.infer<typeof StartQuizAttemptResponseSchema>;

export const SubmitQuizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid(),
});
export type SubmitQuizAnswer = z.infer<typeof SubmitQuizAnswerSchema>;

export const SubmitQuizAttemptRequestSchema = z.object({
  answers: z.array(SubmitQuizAnswerSchema).min(1),
});
export type SubmitQuizAttemptRequest = z.infer<typeof SubmitQuizAttemptRequestSchema>;

export const QuizAttemptResultSchema = z.object({
  attemptId: z.string().uuid(),
  quizId: z.string().uuid(),
  status: z.enum(["submitted", "expired"]),
  score: z.number().nonnegative(),
  maxScore: z.number().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  totalQuestions: z.number().int().nonnegative(),
  submittedAt: z.string().datetime(),
});
export type QuizAttemptResult = z.infer<typeof QuizAttemptResultSchema>;

export const ResourceProgressSchema = z.object({
  resourceId: z.string().uuid(),
  lastPage: z.number().int().positive(),
  percent: z.number().min(0).max(1),
  completedAt: z.string().datetime().nullable(),
  lastOpenedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ResourceProgress = z.infer<typeof ResourceProgressSchema>;

export const UpsertResourceProgressRequestSchema = z.object({
  lastPage: z.number().int().positive(),
  percent: z.number().min(0).max(1),
  completed: z.boolean().optional(),
});
export type UpsertResourceProgressRequest = z.infer<typeof UpsertResourceProgressRequestSchema>;

export const ProgressSummaryResponseSchema = z.object({
  resources: z.array(ResourceProgressSchema),
  currentStreakDays: z.number().int().nonnegative(),
  longestStreakDays: z.number().int().nonnegative(),
});
export type ProgressSummaryResponse = z.infer<typeof ProgressSummaryResponseSchema>;

export const RewardSummaryResponseSchema = z.object({
  totalPoints: z.number().int(),
  badges: z.array(z.object({
    id: z.string().uuid(),
    key: z.string().min(1),
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    awardedAt: z.string().datetime(),
  })),
});
export type RewardSummaryResponse = z.infer<typeof RewardSummaryResponseSchema>;

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().uuid().nullable(),
  displayName: z.string().min(1),
  points: z.number().int(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardResponseSchema = z.object({
  scopeKey: z.string().min(1),
  entries: z.array(LeaderboardEntrySchema),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  bodyAr: z.string().min(1),
  bodyEn: z.string().min(1),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListResponseSchema = z.object({
  data: z.array(NotificationSchema),
  unreadCount: z.number().int().nonnegative(),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

export const MarkNotificationReadResponseSchema = z.object({
  id: z.string().uuid(),
  readAt: z.string().datetime(),
});
export type MarkNotificationReadResponse = z.infer<typeof MarkNotificationReadResponseSchema>;

export const ContactMessageRequestSchema = z.object({
  email: z.string().email(),
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(5000),
});
export type ContactMessageRequest = z.infer<typeof ContactMessageRequestSchema>;

export const ContactMessageResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("unread"),
  createdAt: z.string().datetime(),
});
export type ContactMessageResponse = z.infer<typeof ContactMessageResponseSchema>;

export const ContentReportRequestSchema = z.object({
  resourceId: z.string().uuid(),
  reason: z.string().trim().min(3).max(200),
  details: z.string().trim().max(5000).optional(),
});
export type ContentReportRequest = z.infer<typeof ContentReportRequestSchema>;

export const ContentReportResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("open"),
  createdAt: z.string().datetime(),
});
export type ContentReportResponse = z.infer<typeof ContentReportResponseSchema>;

export const AiConversationSchema = z.object({
  id: z.string().uuid(),
  feature: z.string().min(1),
  locale: LocaleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AiConversation = z.infer<typeof AiConversationSchema>;

export const CreateAiConversationRequestSchema = z.object({
  feature: z.string().trim().min(2).max(80),
  locale: LocaleSchema.default("ar"),
});
export type CreateAiConversationRequest = z.infer<typeof CreateAiConversationRequestSchema>;

export const AiMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
  model: z.string().nullable(),
  citations: z.array(z.unknown()),
  createdAt: z.string().datetime(),
});
export type AiMessage = z.infer<typeof AiMessageSchema>;

export const AiConversationDetailResponseSchema = AiConversationSchema.extend({
  messages: z.array(AiMessageSchema),
});
export type AiConversationDetailResponse = z.infer<typeof AiConversationDetailResponseSchema>;

export const CreateAiMessageRequestSchema = z.object({
  content: z.string().trim().min(1).max(12000),
});
export type CreateAiMessageRequest = z.infer<typeof CreateAiMessageRequestSchema>;

export const CreateAiMessageResponseSchema = z.object({
  userMessage: AiMessageSchema,
  assistantMessage: AiMessageSchema.nullable(),
});
export type CreateAiMessageResponse = z.infer<typeof CreateAiMessageResponseSchema>;

export const AiFeedbackRequestSchema = z.object({
  messageId: z.string().uuid().optional(),
  rating: z.union([z.literal(-1), z.literal(1)]),
  note: z.string().trim().max(2000).optional(),
});
export type AiFeedbackRequest = z.infer<typeof AiFeedbackRequestSchema>;

export const AiFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  rating: z.union([z.literal(-1), z.literal(1)]),
  createdAt: z.string().datetime(),
});
export type AiFeedbackResponse = z.infer<typeof AiFeedbackResponseSchema>;
