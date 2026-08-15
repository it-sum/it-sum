import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  libraryQuerySchema,
  libraryResponseSchema,
  resourceSchema,
  streamTicketSchema,
  type LibraryQuery,
  type LibraryResponse,
  type StreamTicket,
} from '@it-sum/shared';
import { DriveService } from '../drive/drive.service';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { StreamTicketService } from './stream-ticket.service';

function richText(value: unknown) {
  if (value && typeof value === 'object') return value;
  return { ar: null, en: null };
}

type DbRow = Record<string, unknown>;

function isoOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

@Injectable()
export class LibraryService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly drive: DriveService,
    private readonly streamTickets: StreamTicketService,
  ) {}

  async browse(rawQuery: unknown, user: AuthenticatedUser): Promise<LibraryResponse> {
    const query = libraryQuerySchema.parse(rawQuery) as LibraryQuery;
    if (!user.universityId) return libraryResponseSchema.parse({ items: [], folders: [], breadcrumbs: [], facets: this.emptyFacets(), nextCursor: null, total: 0 });

    let builder = this.supabase.admin
      .from('resources')
      .select('*', { count: 'exact' })
      .eq('university_id', user.universityId)
      .eq('state', 'published');

    if (query.courseId) builder = builder.eq('course_id', query.courseId);
    if (query.folderId) builder = builder.eq('folder_id', query.folderId);
    if (query.materialKind) builder = builder.eq('material_kind', query.materialKind);
    if (query.examPhase) builder = builder.eq('exam_phase', query.examPhase);
    if (query.type) builder = builder.eq('type', query.type);
    if (query.onlySearchable) builder = builder.eq('is_searchable', true);
    if (query.search) builder = builder.textSearch('search_document', query.search, { type: 'websearch', config: 'simple' });

    const ascending = query.sort === 'title';
    const orderColumn = query.sort === 'size' ? 'size_bytes' : query.sort === 'popular' ? 'view_count' : query.sort === 'title' ? 'display_title' : 'published_at';
    builder = builder.order(orderColumn, { ascending, nullsFirst: false }).range(0, query.limit - 1);
    const { data, count, error } = await builder;
    if (error) throw new Error(`Failed to browse library: ${error.message}`);

    const rows = data ?? [];
    const resourceIds = rows.map((row) => row.id as string);
    const [progressResult, bookmarkResult] = await Promise.all([
      resourceIds.length ? this.supabase.admin.from('resource_progress').select('resource_id,percent,last_page,last_second,completed_at,updated_at').eq('user_id', user.id).in('resource_id', resourceIds) : Promise.resolve({ data: [], error: null }),
      resourceIds.length ? this.supabase.admin.from('bookmarks').select('resource_id').eq('user_id', user.id).in('resource_id', resourceIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (progressResult.error) throw new Error(`Failed to load progress: ${progressResult.error.message}`);
    if (bookmarkResult.error) throw new Error(`Failed to load bookmarks: ${bookmarkResult.error.message}`);

    const progressById = new Map((progressResult.data ?? []).map((item) => [item.resource_id, item]));
    const bookmarked = new Set((bookmarkResult.data ?? []).map((item) => item.resource_id));
    const items = rows.map((row) => this.toResource(row, progressById.get(row.id), bookmarked.has(row.id)));
    const folders = query.folderId ? [] : await this.listFolders(user.universityId);
    const response = {
      items: items.map((item) => ({
        id: item.id,
        courseId: item.courseId,
        type: item.type,
        displayTitle: item.displayTitle,
        materialKind: item.materialKind,
        examPhase: item.examPhase,
        sizeBytes: item.sizeBytes,
        pageCount: item.pageCount,
        durationSeconds: item.durationSeconds,
        thumbnailUrl: item.thumbnailUrl,
        textQuality: item.textQuality,
        isSearchable: item.isSearchable,
        downloadAllowed: item.downloadAllowed,
        state: item.state,
        progress: item.progress,
        isBookmarked: item.isBookmarked,
        publishedAt: item.publishedAt,
      })),
      folders,
      breadcrumbs: [],
      facets: this.makeFacets(rows),
      nextCursor: null,
      total: count ?? 0,
    };
    return libraryResponseSchema.parse(response);
  }

  async issueStreamTicket(resourceId: string, user: AuthenticatedUser): Promise<StreamTicket> {
    const resource = await this.findResource(resourceId, user.universityId);
    if (!resource.drive_file_id || resource.type !== 'pdf') throw new NotFoundException('Streamable PDF not found');
    const issued = await this.streamTickets.issue({
      userId: user.id,
      resourceId,
      driveFileId: resource.drive_file_id,
      mimeType: resource.mime_type ?? 'application/pdf',
      downloadAllowed: resource.download_allowed,
    });
    return streamTicketSchema.parse({
      url: `/api/v1/library/resources/${resourceId}/stream?ticket=${encodeURIComponent(issued.token)}`,
      expiresAt: issued.expiresAt,
      sizeBytes: resource.size_bytes,
      mimeType: resource.mime_type ?? 'application/pdf',
      supportsRange: true,
    });
  }

  async streamResource(resourceId: string, token: string, user: AuthenticatedUser, range?: { start: number; end?: number }) {
    const ticket = await this.streamTickets.verify(token);
    if (ticket.resourceId !== resourceId || ticket.userId !== user.id) throw new ForbiddenException('Stream ticket does not belong to this user');
    const resource = await this.findResource(resourceId, user.universityId);
    if (!resource.drive_file_id || resource.state !== 'published') throw new NotFoundException('Resource not found');
    const stream = await this.drive.download(resource.drive_file_id, range);
    return { ...stream, totalSizeBytes: resource.size_bytes as number | null, mimeType: resource.mime_type ?? stream.mimeType };
  }

  private async findResource(resourceId: string, universityId: string | null) {
    if (!universityId) throw new NotFoundException('Resource not found');
    const { data, error } = await this.supabase.admin.from('resources').select('*').eq('id', resourceId).eq('university_id', universityId).eq('state', 'published').maybeSingle();
    if (error || !data) throw new NotFoundException('Resource not found');
    return data;
  }

  private async listFolders(universityId: string) {
    const { data, error } = await this.supabase.admin.from('folders').select('id,parent_id,course_id,drive_folder_id,name,display_name,path,depth,material_kind,exam_phase,resource_count,child_folder_count').eq('university_id', universityId).eq('state', 'published').order('path', { ascending: true }).limit(100);
    if (error) throw new Error(`Failed to load folders: ${error.message}`);
    return (data ?? []).map((folder) => ({
      id: folder.id,
      parentId: folder.parent_id,
      courseId: folder.course_id,
      driveFolderId: folder.drive_folder_id,
      name: folder.name,
      displayName: folder.display_name,
      path: folder.path,
      depth: folder.depth,
      materialKind: folder.material_kind,
      examPhase: folder.exam_phase,
      resourceCount: folder.resource_count,
      childFolderCount: folder.child_folder_count,
    }));
  }

  private toResource(row: DbRow, progress?: DbRow, bookmarked = false) {
    const resource = {
      id: row.id,
      courseId: row.course_id,
      folderId: row.folder_id,
      type: row.type,
      title: row.title,
      displayTitle: row.display_title,
      description: richText(row.description),
      materialKind: row.material_kind,
      examPhase: row.exam_phase,
      contributors: [],
      driveFileId: row.drive_file_id,
      youtubeId: null,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      pageCount: row.page_count,
      durationSeconds: null,
      thumbnailUrl: row.thumbnail_url,
      md5: row.md5,
      textQuality: row.text_quality,
      isSearchable: row.is_searchable,
      isAiReady: row.is_ai_ready,
      downloadAllowed: row.download_allowed,
      state: row.state === 'review' ? 'draft' : row.state,
      tags: row.tags ?? [],
      viewCount: row.view_count ?? 0,
      publishedAt: isoOrNull(row.published_at),
      driveModifiedAt: isoOrNull(row.drive_modified_at),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      progress: progress ? { percent: progress.percent, lastPage: progress.last_page, lastSecond: progress.last_second, completedAt: progress.completed_at, updatedAt: progress.updated_at } : null,
      isBookmarked: bookmarked,
    };
    return resourceSchema.parse(resource);
  }

  private emptyFacets() {
    return { materialKinds: [], examPhases: [], contributors: [], types: [], courses: [] };
  }

  private makeFacets(rows: DbRow[]) {
    const bucket = (key: string) => {
      const values = rows.map((row) => row[key]).filter((value): value is string => typeof value === 'string');
      return [...new Set(values)].map((value) => ({ value, label: value, count: rows.filter((row) => row[key] === value).length }));
    };
    return {
      materialKinds: bucket('material_kind'),
      examPhases: bucket('exam_phase'),
      contributors: [],
      types: bucket('type'),
      courses: bucket('course_id'),
    };
  }
}
