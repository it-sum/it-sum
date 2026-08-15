import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { DriveChange, DriveFile } from '@it-sum/drive';
import { getEnv } from '../../common/config/env';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { DriveService } from './drive.service';

const DEFAULT_UNIVERSITY_ID = '00000000-0000-4000-8000-000000000001';
const PDF_MIME = 'application/pdf';

type SyncMode = 'full' | 'delta' | 'subtree';

export interface SyncSummary {
  runId: string | null;
  mode: SyncMode;
  status: 'success' | 'partial' | 'failed';
  foldersSeen: number;
  filesSeen: number;
  filesCreated: number;
  filesUpdated: number;
  filesDeleted: number;
  conflicts: number;
  errors: string[];
}

@Injectable()
export class DriveSyncService {
  constructor(
    private readonly drive: DriveService,
    private readonly supabase: SupabaseService,
  ) {}

  async fullSync(): Promise<SyncSummary> {
    const rootId = getEnv().DRIVE_ROOT_FOLDER_ID;
    if (!rootId) throw new ServiceUnavailableException('DRIVE_ROOT_FOLDER_ID is not configured');
    if (!this.drive.configured) throw new ServiceUnavailableException('Google Drive is not configured');

    const universityId = getEnv().SYNC_UNIVERSITY_ID ?? DEFAULT_UNIVERSITY_ID;
    const runId = await this.startRun(universityId, 'full');
    const summary: SyncSummary = { runId, mode: 'full', status: 'success', foldersSeen: 0, filesSeen: 0, filesCreated: 0, filesUpdated: 0, filesDeleted: 0, conflicts: 0, errors: [] };
    try {
      await this.walkFolder(rootId, null, '', universityId, summary);
      await this.finishRun(runId, summary);
    } catch (error: unknown) {
      summary.status = 'partial';
      summary.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      await this.finishRun(runId, summary);
    }
    return summary;
  }

  async deltaSync(): Promise<SyncSummary> {
    if (!this.drive.configured) throw new ServiceUnavailableException('Google Drive is not configured');
    const universityId = getEnv().SYNC_UNIVERSITY_ID ?? DEFAULT_UNIVERSITY_ID;
    const accountId = await this.ensureAccount(universityId);
    const { data: state } = await this.supabase.admin.from('drive_sync_state').select('last_page_token,start_page_token').eq('drive_account_id', accountId).maybeSingle();
    const pageToken = state?.last_page_token ?? state?.start_page_token ?? await this.drive.getStartPageToken();
    const runId = await this.startRun(universityId, 'delta');
    const summary: SyncSummary = { runId, mode: 'delta', status: 'success', foldersSeen: 0, filesSeen: 0, filesCreated: 0, filesUpdated: 0, filesDeleted: 0, conflicts: 0, errors: [] };
    let token: string | null = pageToken;
    try {
      while (token) {
        const page = await this.drive.listChanges(token);
        for (const change of page.changes) await this.applyChange(change, universityId, summary);
        token = page.nextPageToken;
        if (page.newStartPageToken) {
          await this.supabase.admin.from('drive_sync_state').upsert({ drive_account_id: accountId, start_page_token: page.newStartPageToken, last_page_token: page.newStartPageToken, last_delta_sync_at: new Date().toISOString() }, { onConflict: 'drive_account_id' });
        }
      }
      await this.finishRun(runId, summary);
    } catch (error: unknown) {
      summary.status = 'partial';
      summary.errors.push(error instanceof Error ? error.message : 'Unknown delta sync error');
      await this.finishRun(runId, summary);
    }
    return summary;
  }

  private async walkFolder(folderId: string, parentId: string | null, path: string, universityId: string, summary: SyncSummary) {
    let pageToken: string | undefined;
    let folderRecordId: string | null = null;
    do {
      const page = await this.drive.listChildren({ folderId, pageToken, pageSize: 1000 });
      for (const file of page.files) {
        summary.filesSeen += 1;
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          summary.foldersSeen += 1;
          const nextPath = path ? `${path}/${file.name}` : file.name;
          folderRecordId = await this.upsertFolder(file, parentId, nextPath, universityId);
          await this.walkFolder(file.id, folderRecordId, nextPath, universityId, summary);
        } else if (file.mimeType === PDF_MIME || file.name.toLowerCase().endsWith('.pdf')) {
          await this.upsertPdf(file, folderRecordId, universityId, summary);
        }
      }
      pageToken = page.nextPageToken ?? undefined;
    } while (pageToken);
  }

  private async upsertFolder(file: DriveFile, parentId: string | null, path: string, universityId: string): Promise<string> {
    const payload = {
      university_id: universityId,
      parent_id: parentId,
      drive_folder_id: file.id,
      name: file.name,
      display_name: file.name.trim(),
      normalized_name: file.name.trim().toLocaleLowerCase(),
      path,
      depth: path.split('/').length - 1,
      material_kind: 'other',
      exam_phase: 'unphased',
      state: 'draft',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.supabase.admin.from('folders').upsert(payload, { onConflict: 'university_id,drive_folder_id' }).select('id').single();
    if (error || !data) throw new Error(`Folder upsert failed: ${error?.message ?? 'no id'}`);
    return data.id;
  }

  private async upsertPdf(file: DriveFile, folderId: string | null, universityId: string, summary: SyncSummary) {
    const existing = await this.supabase.admin.from('resources').select('id').eq('university_id', universityId).eq('drive_file_id', file.id).maybeSingle();
    const wasExisting = Boolean(existing.data);
    const row = {
      university_id: universityId,
      folder_id: folderId,
      type: 'pdf',
      title: file.name,
      display_title: file.name.replace(/\.pdf$/i, '').trim(),
      material_kind: 'other',
      exam_phase: 'unphased',
      state: 'draft',
      drive_file_id: file.id,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
      md5: file.md5Checksum,
      text_quality: 'none',
      is_searchable: false,
      is_ai_ready: false,
      download_allowed: false,
      drive_modified_at: file.modifiedTime,
      updated_at: new Date().toISOString(),
    };
    const { error } = await this.supabase.admin.from('resources').upsert(row, { onConflict: 'university_id,drive_file_id' });
    if (error) {
      if (file.md5Checksum && error.message.toLowerCase().includes('md5')) {
        const fallback = await this.supabase.admin.from('resources').upsert({ ...row, md5: null }, { onConflict: 'university_id,drive_file_id' });
        if (fallback.error) throw new Error(`PDF upsert failed: ${fallback.error.message}`);
        summary.conflicts += 1;
        await this.supabase.admin.from('drive_conflicts').insert({ university_id: universityId, drive_file_id: file.id, conflict_type: 'duplicate_md5', details: { md5: file.md5Checksum, name: file.name } });
      } else {
        throw new Error(`PDF upsert failed: ${error.message}`);
      }
    }
    if (wasExisting) summary.filesUpdated += 1;
    else summary.filesCreated += 1;
  }

  private async applyChange(change: DriveChange, universityId: string, summary: SyncSummary) {
    summary.filesSeen += 1;
    if (change.removed) {
      const { error } = await this.supabase.admin.from('resources').update({ state: 'unavailable', updated_at: new Date().toISOString() }).eq('university_id', universityId).eq('drive_file_id', change.fileId);
      if (error) throw new Error(`Drive deletion update failed: ${error.message}`);
      summary.filesDeleted += 1;
      return;
    }
    if (change.file?.mimeType === PDF_MIME || change.file?.name.toLowerCase().endsWith('.pdf')) await this.upsertPdf(change.file, null, universityId, summary);
  }

  private async ensureAccount(universityId: string) {
    const env = getEnv();
    const { data, error } = await this.supabase.admin.from('drive_accounts').upsert({ university_id: universityId, mode: this.drive.mode ?? env.DRIVE_MODE, root_folder_id: env.DRIVE_ROOT_FOLDER_ID, status: 'connected', updated_at: new Date().toISOString() }, { onConflict: 'university_id' }).select('id').single();
    if (error || !data) throw new Error(`Drive account unavailable: ${error?.message ?? 'no account id'}`);
    return data.id;
  }

  private async startRun(universityId: string, mode: SyncMode) {
    const accountId = await this.ensureAccount(universityId);
    const { data } = await this.supabase.admin.from('drive_sync_runs').insert({ drive_account_id: accountId, mode, status: 'running' }).select('id').single();
    return data?.id ?? null;
  }

  private async finishRun(runId: string | null, summary: SyncSummary) {
    if (!runId) return;
    await this.supabase.admin.from('drive_sync_runs').update({ status: summary.status, finished_at: new Date().toISOString(), pages_read: summary.foldersSeen, files_seen: summary.filesSeen, files_created: summary.filesCreated, files_updated: summary.filesUpdated, files_deleted: summary.filesDeleted, error_message: summary.errors.join('; ') || null }).eq('id', runId);
  }
}
