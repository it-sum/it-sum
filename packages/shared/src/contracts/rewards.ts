import { z } from 'zod';
import {
  leaderboardScopeSchema,
  leaderboardVisibilitySchema,
  pointReasonSchema,
} from '../domain/enums';
import {
  bilingualRichTextSchema,
  bilingualTextSchema,
  countSchema,
  idempotencyKeySchema,
  isoDateTimeSchema,
  paginationQuerySchema,
  percentSchema,
  uuidSchema,
} from '../domain/primitives';

/**
 * Rewards contract.
 *
 * Points live in an append-only ledger. There is no "balance" column to race on;
 * a total is the sum of entries, and every entry carries a unique idempotency key
 * so a retried request or a replayed submission adds nothing. This is what makes
 * the leaderboard trustworthy without any additional locking.
 */

export const pointsLedgerEntrySchema = z.object({
  id: uuidSchema,
  reason: pointReasonSchema,
  points: z.number().int(),
  description: z.string().max(300),
  referenceType: z.enum(['quiz_attempt', 'resource', 'video', 'course', 'streak', 'roadmap_node', 'manual']),
  referenceId: uuidSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type PointsLedgerEntry = z.infer<typeof pointsLedgerEntrySchema>;

export const badgeSchema = z.object({
  id: uuidSchema,
  slug: z.string().min(1).max(80),
  name: bilingualTextSchema,
  description: bilingualRichTextSchema,
  iconName: z.string().max(60),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  pointsReward: countSchema,
  isSecret: z.boolean(),
});
export type Badge = z.infer<typeof badgeSchema>;

export const earnedBadgeSchema = badgeSchema.extend({
  earnedAt: isoDateTimeSchema,
});
export type EarnedBadge = z.infer<typeof earnedBadgeSchema>;

/** A badge the student has not yet earned, with how close they are. */
export const badgeProgressSchema = badgeSchema.extend({
  progressPercent: percentSchema,
  progressLabel: z.string().max(120),
});
export type BadgeProgress = z.infer<typeof badgeProgressSchema>;

export const rewardsOverviewSchema = z.object({
  totalPoints: countSchema,
  rank: countSchema.nullable(),
  rankScope: leaderboardScopeSchema.nullable(),
  earnedBadges: z.array(earnedBadgeSchema),
  nextBadges: z.array(badgeProgressSchema),
  recentEntries: z.array(pointsLedgerEntrySchema),
  pointsThisWeek: countSchema,
  pointsThisMonth: countSchema,
});
export type RewardsOverview = z.infer<typeof rewardsOverviewSchema>;

/**
 * A leaderboard row. `displayName` is already redacted server-side according to
 * the student's own visibility preference, so the client cannot accidentally
 * reveal a name that its owner chose to hide.
 */
export const leaderboardEntrySchema = z.object({
  rank: countSchema,
  userId: uuidSchema.nullable(),
  displayName: z.string().max(80),
  avatarUrl: z.string().url().nullable(),
  points: countSchema,
  badgeCount: countSchema,
  visibility: leaderboardVisibilitySchema,
  isCurrentUser: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardQuerySchema = paginationQuerySchema.extend({
  scope: leaderboardScopeSchema.default('course'),
  scopeId: uuidSchema.optional(),
  period: z.enum(['all_time', 'month', 'week']).default('all_time'),
});
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export const leaderboardResponseSchema = z.object({
  scope: leaderboardScopeSchema,
  scopeId: uuidSchema.nullable(),
  scopeName: z.string(),
  period: z.enum(['all_time', 'month', 'week']),
  entries: z.array(leaderboardEntrySchema),
  currentUserEntry: leaderboardEntrySchema.nullable(),
  totalParticipants: countSchema,
  generatedAt: isoDateTimeSchema,
});
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;

/** Declarative reward rule, editable by administrators. */
export const rewardRuleSchema = z.object({
  id: uuidSchema,
  reason: pointReasonSchema,
  points: z.number().int().min(0).max(10_000),
  /** Optional per-day cap so a single action cannot be farmed. */
  dailyCap: countSchema.nullable(),
  isActive: z.boolean(),
  conditions: z.record(z.unknown()).nullable(),
});
export type RewardRule = z.infer<typeof rewardRuleSchema>;

export const updateRewardRuleRequestSchema = rewardRuleSchema
  .pick({ points: true, dailyCap: true, isActive: true })
  .partial();
export type UpdateRewardRuleRequest = z.infer<typeof updateRewardRuleRequestSchema>;

/** Manual adjustment by an administrator; always audited. */
export const grantPointsRequestSchema = z.object({
  userId: uuidSchema,
  points: z.number().int().min(-10_000).max(10_000),
  description: z.string().min(3).max(300),
  idempotencyKey: idempotencyKeySchema,
});
export type GrantPointsRequest = z.infer<typeof grantPointsRequestSchema>;
