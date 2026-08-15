import { Controller, Get, Query } from "@nestjs/common";
import { z } from "zod";
import {
  LeaderboardResponseSchema,
  RewardSummaryResponseSchema,
  type LeaderboardResponse,
  type RewardSummaryResponse,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

const LeaderboardQuerySchema = z.object({
  scopeKey: z.string().trim().min(1).max(100).default("overall"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller("rewards")
export class RewardsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("me")
  async myRewards(@CurrentUser() user: AuthUser): Promise<RewardSummaryResponse> {
    const client = this.supabase.requireClient();
    const [points, badges] = await Promise.all([
      client
        .from("points_ledger")
        .select("points")
        .eq("university_id", user.universityId)
        .eq("user_id", user.sub),
      client
        .from("user_badges")
        .select("awarded_at, badges(id, key, name_ar, name_en)")
        .eq("university_id", user.universityId)
        .eq("user_id", user.sub)
        .order("awarded_at", { ascending: false }),
    ]);

    if (points.error) throw points.error;
    if (badges.error) throw badges.error;

    return RewardSummaryResponseSchema.parse({
      totalPoints: (points.data ?? []).reduce((sum, row) => sum + row.points, 0),
      badges: (badges.data ?? []).flatMap((row) => {
        const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;
        return badge ? [{
          id: badge.id,
          key: badge.key,
          nameAr: badge.name_ar,
          nameEn: badge.name_en,
          awardedAt: row.awarded_at,
        }] : [];
      }),
    });
  }

  @Get("leaderboard")
  async leaderboard(@CurrentUser() user: AuthUser, @Query() query: unknown): Promise<LeaderboardResponse> {
    const input = LeaderboardQuerySchema.parse(query);
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("points_ledger")
      .select("user_id, points, profiles(display_name, leaderboard_visibility)")
      .eq("university_id", user.universityId)
      .limit(5000);

    if (error) throw error;

    const totals = new Map<string, { points: number; displayName: string }>();
    for (const row of data ?? []) {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const visibility = profile?.leaderboard_visibility ?? "anonymous";
      const displayName = visibility === "full"
        ? profile?.display_name ?? "Student"
        : visibility === "initial"
          ? `${profile?.display_name?.trim().charAt(0) ?? "S"}.`
          : "Anonymous";
      const current = totals.get(row.user_id) ?? { points: 0, displayName };
      current.points += row.points;
      totals.set(row.user_id, current);
    }

    const entries = [...totals.entries()]
      .map(([userId, value]) => ({ userId, ...value }))
      .sort((a, b) => b.points - a.points)
      .slice(0, input.limit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.displayName === "Anonymous" ? null : entry.userId,
        displayName: entry.displayName,
        points: entry.points,
      }));

    return LeaderboardResponseSchema.parse({ scopeKey: input.scopeKey, entries });
  }
}
