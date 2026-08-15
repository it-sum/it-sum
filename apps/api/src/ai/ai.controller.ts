import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, ServiceUnavailableException } from "@nestjs/common";
import {
  AiConversationDetailResponseSchema,
  AiConversationSchema,
  AiFeedbackRequestSchema,
  AiFeedbackResponseSchema,
  CreateAiConversationRequestSchema,
  CreateAiMessageRequestSchema,
  CreateAiMessageResponseSchema,
  type AiConversation,
  type AiConversationDetailResponse,
  type AiFeedbackRequest,
  type AiFeedbackResponse,
  type CreateAiConversationRequest,
  type CreateAiMessageRequest,
  type CreateAiMessageResponse,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("ai")
export class AiController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post("conversations")
  async createConversation(@CurrentUser() user: AuthUser, @Body() body: CreateAiConversationRequest): Promise<AiConversation> {
    const input = CreateAiConversationRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("ai_conversations")
      .insert({
        university_id: user.universityId,
        user_id: user.sub,
        feature: input.feature,
        locale: input.locale,
      })
      .select("id, feature, locale, created_at, updated_at")
      .single();

    if (error) throw error;
    return AiConversationSchema.parse({
      id: data.id,
      feature: data.feature,
      locale: data.locale,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  @Get("conversations/:id")
  async conversation(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string): Promise<AiConversationDetailResponse> {
    const client = this.supabase.requireClient();
    const { data: conversation, error: conversationError } = await client
      .from("ai_conversations")
      .select("id, feature, locale, created_at, updated_at")
      .eq("id", id)
      .eq("university_id", user.universityId)
      .eq("user_id", user.sub)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) throw new NotFoundException("AI conversation was not found");

    const { data: messages, error: messagesError } = await client
      .from("ai_messages")
      .select("id, role, content, model, citations, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at");

    if (messagesError) throw messagesError;

    return AiConversationDetailResponseSchema.parse({
      id: conversation.id,
      feature: conversation.feature,
      locale: conversation.locale,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: (messages ?? []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        model: message.model,
        citations: Array.isArray(message.citations) ? message.citations : [],
        createdAt: message.created_at,
      })),
    });
  }

  @Post("conversations/:id/messages")
  async createMessage(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CreateAiMessageRequest,
  ): Promise<CreateAiMessageResponse> {
    const input = CreateAiMessageRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data: conversation, error: conversationError } = await client
      .from("ai_conversations")
      .select("id")
      .eq("id", id)
      .eq("university_id", user.universityId)
      .eq("user_id", user.sub)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) throw new NotFoundException("AI conversation was not found");

    const { data: providerKey, error: providerError } = await client
      .from("ai_provider_keys")
      .select("id")
      .eq("university_id", user.universityId)
      .eq("enabled", true)
      .limit(1)
      .maybeSingle();

    if (providerError) throw providerError;
    if (!providerKey) {
      throw new ServiceUnavailableException("AI provider is not configured for this university");
    }

    const { data: userMessage, error: messageError } = await client
      .from("ai_messages")
      .insert({
        conversation_id: conversation.id,
        role: "user",
        content: input.content,
      })
      .select("id, role, content, model, citations, created_at")
      .single();

    if (messageError) throw messageError;

    return CreateAiMessageResponseSchema.parse({
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        model: userMessage.model,
        citations: Array.isArray(userMessage.citations) ? userMessage.citations : [],
        createdAt: userMessage.created_at,
      },
      assistantMessage: null,
    });
  }

  @Post("feedback")
  async feedback(@CurrentUser() user: AuthUser, @Body() body: AiFeedbackRequest): Promise<AiFeedbackResponse> {
    const input = AiFeedbackRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("ai_feedback")
      .insert({
        university_id: user.universityId,
        user_id: user.sub,
        message_id: input.messageId ?? null,
        rating: input.rating,
        note: input.note ?? null,
      })
      .select("id, rating, created_at")
      .single();

    if (error) throw error;
    return AiFeedbackResponseSchema.parse({
      id: data.id,
      rating: data.rating,
      createdAt: data.created_at,
    });
  }
}
