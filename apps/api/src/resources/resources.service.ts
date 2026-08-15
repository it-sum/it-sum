import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ResourceListResponseSchema,
  ResourceSchema,
  type ResourceListQuery,
  type ResourceListResponse,
} from "@it-sum/shared";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";
import { StreamTokenService } from "./stream-token.service.js";

const RESOURCE_COLUMNS = [
  "id",
  "university_id",
  "title",
  "normalized_title",
  "mime_type",
  "size_bytes",
  "page_count",
  "drive_file_id",
  "drive_md5",
  "modified_at",
  "status",
  "visibility",
  "download_allowed",
  "text_quality",
  "course_id",
  "contributor_id",
  "material_kind_id",
  "exam_phase_id",
  "created_at",
  "updated_at",
].join(",");

@Injectable()
export class ResourcesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly streamTokens: StreamTokenService,
  ) {}

  async list(user: AuthUser, query: ResourceListQuery): Promise<ResourceListResponse> {
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;
    const client = this.supabase.client;
    if (!client) {
      return ResourceListResponseSchema.parse({
        data: [],
        page: query.page,
        pageSize: query.pageSize,
        total: 0,
      });
    }

    let request = client
      .from("resources")
      .select(RESOURCE_COLUMNS, { count: "exact" })
      .eq("university_id", user.universityId)
      .eq("status", "published")
      .order("title", { ascending: true })
      .range(from, to);

    if (query.courseId) request = request.eq("course_id", query.courseId);
    if (query.materialKindId) request = request.eq("material_kind_id", query.materialKindId);
    if (query.examPhaseId) request = request.eq("exam_phase_id", query.examPhaseId);
    if (query.contributorId) request = request.eq("contributor_id", query.contributorId);
    if (query.search) request = request.ilike("normalized_title", `%${query.search}%`);

    const { data, error, count } = await request;
    if (error) throw error;
    return ResourceListResponseSchema.parse({
      data: (data ?? []).map((row) => mapResource(row as unknown as Record<string, unknown>)),
      page: query.page,
      pageSize: query.pageSize,
      total: count ?? 0,
    });
  }

  async issueStreamToken(resourceId: string, user: AuthUser) {
    const resource = await this.getPublishedResource(resourceId, user);
    const token = await this.streamTokens.issue(resource.id, user);
    return {
      token: token.token,
      expiresAt: token.expiresAt.toISOString(),
      url: `/api/v1/resources/${resource.id}/stream?token=${encodeURIComponent(token.token)}`,
    };
  }

  async getPublishedResource(resourceId: string, user: AuthUser) {
    const client = this.supabase.client;
    if (!client) {
      throw new NotFoundException("Resource not found");
    }
    const { data, error } = await client
      .from("resources")
      .select(RESOURCE_COLUMNS)
      .eq("id", resourceId)
      .eq("university_id", user.universityId)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException("Resource not found");
    return ResourceSchema.parse(mapResource(data as unknown as Record<string, unknown>));
  }
}

function mapResource(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    universityId: String(row.university_id),
    title: String(row.title),
    normalizedTitle: String(row.normalized_title),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes ?? 0),
    pageCount: row.page_count == null ? null : Number(row.page_count),
    driveFileId: String(row.drive_file_id),
    driveMd5: row.drive_md5 == null ? null : String(row.drive_md5),
    modifiedAt: row.modified_at == null ? null : String(row.modified_at),
    status: String(row.status),
    visibility: String(row.visibility),
    downloadAllowed: Boolean(row.download_allowed),
    textQuality: row.text_quality == null ? null : Number(row.text_quality),
    courseId: row.course_id == null ? null : String(row.course_id),
    contributorId: row.contributor_id == null ? null : String(row.contributor_id),
    materialKindId: row.material_kind_id == null ? null : String(row.material_kind_id),
    examPhaseId: row.exam_phase_id == null ? null : String(row.exam_phase_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
