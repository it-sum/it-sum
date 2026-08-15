import { Controller, Get, Query } from "@nestjs/common";
import {
  VideoListQuerySchema,
  VideoListResponseSchema,
  type VideoListResponse,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("videos")
export class VideosController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: unknown): Promise<VideoListResponse> {
    const input = VideoListQuerySchema.parse(query);
    const client = this.supabase.requireClient();
    const from = (input.page - 1) * input.pageSize;
    const to = from + input.pageSize - 1;

    let request = client
      .from("videos")
      .select("id, university_id, title, description, course_id, thumbnail_url, duration_seconds, published, created_at, updated_at, video_sources(provider, external_id, source_url)", { count: "exact" })
      .eq("university_id", user.universityId)
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (input.courseId) request = request.eq("course_id", input.courseId);
    if (input.search) request = request.ilike("title", `%${input.search}%`);

    const { data, error, count } = await request;
    if (error) throw error;

    return VideoListResponseSchema.parse({
      data: (data ?? []).map((row) => {
        const source = Array.isArray(row.video_sources) ? row.video_sources[0] : row.video_sources;
        return {
          id: row.id,
          universityId: row.university_id,
          title: row.title,
          description: row.description,
          courseId: row.course_id,
          thumbnailUrl: row.thumbnail_url,
          durationSeconds: row.duration_seconds,
          published: row.published,
          provider: source?.provider ?? null,
          externalId: source?.external_id ?? null,
          sourceUrl: source?.source_url ?? null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }),
      page: input.page,
      pageSize: input.pageSize,
      total: count ?? 0,
    });
  }
}
