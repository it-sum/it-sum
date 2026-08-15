import { Body, Controller, Get, NotFoundException, Patch } from "@nestjs/common";
import {
  ProfileSchema,
  UpdatePreferencesRequestSchema,
  UserPreferencesSchema,
  type Profile,
  type UpdatePreferencesRequest,
  type UserPreferences,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("users")
export class UsersController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthUser): Promise<Profile> {
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("profiles")
      .select("id, university_id, email, display_name, role, status, leaderboard_visibility, created_at, updated_at")
      .eq("id", user.sub)
      .eq("university_id", user.universityId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException("Profile was not found");

    return ProfileSchema.parse({
      id: data.id,
      universityId: data.university_id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      status: data.status,
      leaderboardVisibility: data.leaderboard_visibility,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  @Get("me/preferences")
  async preferences(@CurrentUser() user: AuthUser): Promise<UserPreferences> {
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("user_preferences")
      .select("user_id, locale, theme, reminders_enabled, ai_enabled, created_at, updated_at")
      .eq("user_id", user.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return UserPreferencesSchema.parse({
        userId: user.sub,
        locale: "ar",
        theme: "system",
        remindersEnabled: true,
        aiEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return UserPreferencesSchema.parse({
      userId: data.user_id,
      locale: data.locale,
      theme: data.theme,
      remindersEnabled: data.reminders_enabled,
      aiEnabled: data.ai_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  @Patch("me/preferences")
  async updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdatePreferencesRequest,
  ): Promise<UserPreferences> {
    const input = UpdatePreferencesRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("user_preferences")
      .upsert({
        user_id: user.sub,
        locale: input.locale ?? "ar",
        theme: input.theme ?? "system",
        reminders_enabled: input.remindersEnabled ?? true,
        ai_enabled: input.aiEnabled ?? false,
      })
      .select("user_id, locale, theme, reminders_enabled, ai_enabled, created_at, updated_at")
      .single();

    if (error) throw error;
    return UserPreferencesSchema.parse({
      userId: data.user_id,
      locale: data.locale,
      theme: data.theme,
      remindersEnabled: data.reminders_enabled,
      aiEnabled: data.ai_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
