import { Injectable, ForbiddenException } from '@nestjs/common';
import { progressOverviewSchema, progressUpdateResponseSchema, type ProgressOverview, type ProgressUpdateRequest, type ProgressUpdateResponse } from '@it-sum/shared';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { SupabaseService } from '../../common/supabase/supabase.service';

type DbRow = Record<string, unknown>;

function relationRow(value: unknown): DbRow | null {
  if (Array.isArray(value)) return (value[0] as DbRow | undefined) ?? null;
  return value && typeof value === 'object' ? value as DbRow : null;
}

@Injectable()
export class ProgressService {
  constructor(private readonly supabase: SupabaseService) {}

  async update(body: ProgressUpdateRequest, user: AuthenticatedUser): Promise<ProgressUpdateResponse> {
    if (!user.universityId) throw new ForbiddenException('University membership required');
    const { data: existing } = await this.supabase.admin.from('resource_progress').select('percent,last_page,last_second,completed_at').eq('user_id', user.id).eq('resource_id', body.resourceId).maybeSingle();
    const previous = Number(existing?.percent ?? 0);
    const requested = Math.min(100, Math.max(0, body.percent));
    const serverPercent = Math.max(previous, requested);
    const adjusted = serverPercent !== requested;
    const completedAt = serverPercent >= 100 ? (existing?.completed_at ?? new Date().toISOString()) : null;
    const { error } = await this.supabase.admin.from('resource_progress').upsert({ user_id: user.id, resource_id: body.resourceId, percent: serverPercent, last_page: body.lastPage ?? existing?.last_page ?? null, last_second: body.lastSecond ?? existing?.last_second ?? null, elapsed_seconds: body.elapsedSeconds ?? 0, completed_at: completedAt, last_event_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id,resource_id' });
    if (error) throw new Error(`Unable to save progress: ${error.message}`);
    const pointsAwarded = serverPercent >= 100 && previous < 100 ? await this.awardCompletion(user, body.resourceId) : 0;
    return progressUpdateResponseSchema.parse({ resourceId: body.resourceId, percent: serverPercent, lastPage: body.lastPage ?? existing?.last_page ?? null, lastSecond: body.lastSecond ?? existing?.last_second ?? null, completedAt, adjusted, pointsAwarded });
  }

  async overview(user: AuthenticatedUser): Promise<ProgressOverview> {
    if (!user.universityId) return progressOverviewSchema.parse({ continueItems: [], courses: [], streak: { currentDays: 0, longestDays: 0, lastActiveDate: null, weekActivity: [false, false, false, false, false, false, false] }, activity: [], totals: { resourcesCompleted: 0, videosCompleted: 0, quizzesPassed: 0, minutesStudied: 0, points: 0 } });
    const { data: progress, error } = await this.supabase.admin.from('resource_progress').select('resource_id,percent,last_page,last_second,updated_at,resources(id,course_id,type,display_title,material_kind,exam_phase,size_bytes,page_count,thumbnail_url,text_quality,is_searchable,download_allowed,state,published_at)').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(50);
    if (error) throw new Error(`Unable to load progress overview: ${error.message}`);
    const continueItems = (progress ?? []).filter((row) => Number(row.percent) < 100).map((row) => {
      const resource = this.summary(relationRow(row.resources));
      return { resource, courseName: 'Course', percent: Number(row.percent), lastPage: row.last_page, lastSecond: row.last_second, lastSeenAt: row.updated_at, resumeHref: `/app/resource/${row.resource_id}` };
    });
    const completed = (progress ?? []).filter((row) => Number(row.percent) >= 100);
    const { data: ledger } = await this.supabase.admin.from('points_ledger').select('points').eq('user_id', user.id).limit(500);
    const { data: attempts } = await this.supabase.admin.from('quiz_attempts').select('passed').eq('user_id', user.id).eq('status', 'submitted').limit(500);
    return progressOverviewSchema.parse({ continueItems, courses: [], streak: { currentDays: 0, longestDays: 0, lastActiveDate: null, weekActivity: [false, false, false, false, false, false, false] }, activity: [], totals: { resourcesCompleted: completed.length, videosCompleted: completed.filter((row) => relationRow(row.resources)?.type === 'video').length, quizzesPassed: (attempts ?? []).filter((row) => row.passed === true).length, minutesStudied: 0, points: (ledger ?? []).reduce((total, row) => total + Number(row.points ?? 0), 0) } });
  }

  private summary(resource: DbRow | null) {
    if (!resource) throw new Error('Progress resource is missing');
    return { id: resource.id, courseId: resource.course_id, type: resource.type, displayTitle: resource.display_title, materialKind: resource.material_kind, examPhase: resource.exam_phase, sizeBytes: resource.size_bytes, pageCount: resource.page_count, durationSeconds: null, thumbnailUrl: resource.thumbnail_url, textQuality: resource.text_quality, isSearchable: resource.is_searchable, downloadAllowed: resource.download_allowed, state: resource.state, progress: null, isBookmarked: false, publishedAt: resource.published_at };
  }

  private async awardCompletion(user: AuthenticatedUser, resourceId: string) {
    if (!user.universityId) return 0;
    const { data: rule } = await this.supabase.admin.from('reward_rules').select('points').eq('university_id', user.universityId).eq('event_key', 'resource_completed').eq('is_active', true).maybeSingle();
    const points = Number(rule?.points ?? 0);
    if (!points) return 0;
    const { error } = await this.supabase.admin.from('points_ledger').insert({ university_id: user.universityId, user_id: user.id, event_key: 'resource_completed', points, idempotency_key: `resource:${resourceId}:completed`, source_id: resourceId, metadata: { resourceId } });
    return error && !error.message.toLowerCase().includes('duplicate') ? 0 : points;
  }
}
