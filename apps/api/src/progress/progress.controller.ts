import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from "@nestjs/common";
import {
  ProgressSummaryResponseSchema,
  ResourceProgressSchema,
  UpsertResourceProgressRequestSchema,
  type ProgressSummaryResponse,
  type ResourceProgress,
  type UpsertResourceProgressRequest,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("progress")
export class ProgressController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("me")
  async summary(@CurrentUser() user: AuthUser): Promise<ProgressSummaryResponse> {
    const client = this.supabase.requireClient();
    const [progress, streak] = await Promise.all([
      client
        .from("resource_progress")
        .select("resource_id, last_page, percent, completed_at, last_opened_at, updated_at")
        .eq("university_id", user.universityId)
        .eq("user_id", user.sub)
        .order("updated_at", { ascending: false }),
      client
        .from("streaks")
        .select("current_days, longest_days")
        .eq("university_id", user.universityId)
        .eq("user_id", user.sub)
        .maybeSingle(),
    ]);

    if (progress.error) throw progress.error;
    if (streak.error) throw streak.error;

    return ProgressSummaryResponseSchema.parse({
      resources: (progress.data ?? []).map((row) => ({
        resourceId: row.resource_id,
        lastPage: row.last_page,
        percent: Number(row.percent),
        completedAt: row.completed_at,
        lastOpenedAt: row.last_opened_at,
        updatedAt: row.updated_at,
      })),
      currentStreakDays: streak.data?.current_days ?? 0,
      longestStreakDays: streak.data?.longest_days ?? 0,
    });
  }

  @Put("resources/:resourceId")
  async upsertResourceProgress(
    @CurrentUser() user: AuthUser,
    @Param("resourceId", ParseUUIDPipe) resourceId: string,
    @Body() body: UpsertResourceProgressRequest,
  ): Promise<ResourceProgress> {
    const input = UpsertResourceProgressRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from("resource_progress")
      .upsert({
        user_id: user.sub,
        university_id: user.universityId,
        resource_id: resourceId,
        last_page: input.lastPage,
        percent: input.percent,
        completed_at: input.completed ? now : null,
        last_opened_at: now,
      })
      .select("resource_id, last_page, percent, completed_at, last_opened_at, updated_at")
      .single();

    if (error) throw error;
    return ResourceProgressSchema.parse({
      resourceId: data.resource_id,
      lastPage: data.last_page,
      percent: Number(data.percent),
      completedAt: data.completed_at,
      lastOpenedAt: data.last_opened_at,
      updatedAt: data.updated_at,
    });
  }
}
