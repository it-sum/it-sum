import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import {
  MarkNotificationReadResponseSchema,
  NotificationListResponseSchema,
  type MarkNotificationReadResponse,
  type NotificationListResponse,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<NotificationListResponse> {
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("notifications")
      .select("id, type, title_ar, title_en, body_ar, body_en, read_at, created_at")
      .eq("university_id", user.universityId)
      .eq("user_id", user.sub)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    const notifications = (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      bodyAr: row.body_ar,
      bodyEn: row.body_en,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));

    return NotificationListResponseSchema.parse({
      data: notifications,
      unreadCount: notifications.filter((notification) => notification.readAt === null).length,
    });
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string): Promise<MarkNotificationReadResponse> {
    const client = this.supabase.requireClient();
    const readAt = new Date().toISOString();
    const { data, error } = await client
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", id)
      .eq("university_id", user.universityId)
      .eq("user_id", user.sub)
      .select("id, read_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException("Notification was not found");
    return MarkNotificationReadResponseSchema.parse({ id: data.id, readAt: data.read_at });
  }
}
