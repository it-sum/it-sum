import { Injectable, type OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { createOAuthUserDrive, createSharedDrive, type DriveAdapter, type DriveByteStream, type DriveChangePage, type DriveFile, type DriveListOptions, type DriveListResult, type DriveRange } from '@it-sum/drive';
import { getEnv } from '../../common/config/env';

@Injectable()
export class DriveService implements OnModuleInit {
  private adapter: DriveAdapter | null = null;

  onModuleInit() {
    const env = getEnv();
    try {
      if (env.DRIVE_MODE === 'shared_drive' && env.GOOGLE_SERVICE_ACCOUNT_JSON && env.GOOGLE_SHARED_DRIVE_ID) {
        this.adapter = createSharedDrive({
          serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON,
          sharedDriveId: env.GOOGLE_SHARED_DRIVE_ID,
        });
      } else if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        this.adapter = createOAuthUserDrive({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          refreshToken: env.GOOGLE_REFRESH_TOKEN,
        });
      }
    } catch {
      this.adapter = null;
    }
  }

  get configured(): boolean {
    return this.adapter != null;
  }

  get mode(): DriveAdapter['mode'] | null {
    return this.adapter?.mode ?? null;
  }

  async listChildren(options: DriveListOptions): Promise<DriveListResult> {
    return this.requireAdapter().listChildren(options);
  }

  async getFile(fileId: string): Promise<DriveFile | null> {
    return this.requireAdapter().getFile(fileId);
  }

  async download(fileId: string, range?: DriveRange): Promise<DriveByteStream> {
    return this.requireAdapter().download(fileId, range);
  }

  async getStartPageToken(): Promise<string> {
    return this.requireAdapter().getStartPageToken();
  }

  async listChanges(pageToken: string, pageSize?: number): Promise<DriveChangePage> {
    return this.requireAdapter().listChanges(pageToken, pageSize);
  }

  private requireAdapter(): DriveAdapter {
    if (!this.adapter) throw new ServiceUnavailableException('Google Drive is not configured');
    return this.adapter;
  }
}
