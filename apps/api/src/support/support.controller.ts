import { Body, Controller, Post } from "@nestjs/common";
import {
  ContactMessageRequestSchema,
  ContactMessageResponseSchema,
  ContentReportRequestSchema,
  ContentReportResponseSchema,
  type ContactMessageRequest,
  type ContactMessageResponse,
  type ContentReportRequest,
  type ContentReportResponse,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Public } from "../auth/auth.decorators.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("support")
export class SupportController {
  constructor(private readonly supabase: SupabaseService) {}

  @Public()
  @Post("contact")
  async contact(@Body() body: ContactMessageRequest): Promise<ContactMessageResponse> {
    const input = ContactMessageRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("contact_messages")
      .insert({
        sender_email: input.email,
        subject: input.subject,
        body: input.body,
      })
      .select("id, status, created_at")
      .single();

    if (error) throw error;
    return ContactMessageResponseSchema.parse({
      id: data.id,
      status: data.status,
      createdAt: data.created_at,
    });
  }

  @Post("reports")
  async reportContent(@CurrentUser() user: AuthUser, @Body() body: ContentReportRequest): Promise<ContentReportResponse> {
    const input = ContentReportRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("content_reports")
      .insert({
        university_id: user.universityId,
        resource_id: input.resourceId,
        reporter_id: user.sub,
        reason: input.reason,
        details: input.details ?? null,
      })
      .select("id, status, created_at")
      .single();

    if (error) throw error;
    return ContentReportResponseSchema.parse({
      id: data.id,
      status: data.status,
      createdAt: data.created_at,
    });
  }
}
