import { google, type Auth, type drive_v3 } from 'googleapis';
import { driveFileSchema, type DriveAdapter, type DriveByteStream, type DriveChangePage, type DriveFile, type DriveListOptions, type DriveListResult, type DriveRange } from './types';

function mapFile(file: drive_v3.Schema$File, driveType: DriveFile['driveType']): DriveFile {
  return driveFileSchema.parse({
    id: file.id,
    name: file.name ?? 'Untitled file',
    mimeType: file.mimeType ?? 'application/octet-stream',
    sizeBytes: file.size == null ? null : Number(file.size),
    md5Checksum: file.md5Checksum ?? null,
    modifiedTime: file.modifiedTime ?? null,
    createdTime: file.createdTime ?? null,
    parents: file.parents ?? [],
    webViewLink: file.webViewLink ?? null,
    trashed: Boolean(file.trashed),
    driveType,
  });
}

export interface GoogleDriveAdapterOptions {
  auth: Auth.OAuth2Client | Auth.GoogleAuth;
  driveType: DriveFile['driveType'];
  sharedDriveId?: string;
}

/**
 * Thin, testable wrapper around Drive v3. Both OAuth My Drive and Workspace
 * Shared Drive adapters use the same behaviour; only auth and corpus flags differ.
 */
export class GoogleDriveAdapter implements DriveAdapter {
  readonly mode: DriveAdapter['mode'];
  private readonly drive: drive_v3.Drive;
  private readonly sharedDriveId?: string;
  private readonly driveType: DriveFile['driveType'];

  constructor(options: GoogleDriveAdapterOptions) {
    this.drive = google.drive({ version: 'v3', auth: options.auth });
    this.driveType = options.driveType;
    this.mode = options.driveType === 'shared_drive' ? 'shared_drive' : 'oauth_user';
    this.sharedDriveId = options.sharedDriveId;
  }

  async listChildren(options: DriveListOptions): Promise<DriveListResult> {
    const response = await this.drive.files.list({
      q: `'${options.folderId}' in parents${options.includeTrashed ? '' : ' and trashed = false'}`,
      pageSize: Math.min(options.pageSize ?? 100, 1000),
      pageToken: options.pageToken,
      orderBy: 'folder,name_natural',
      fields: 'nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,createdTime,parents,webViewLink,trashed)',
      ...this.corpusParams(),
    });
    return {
      files: (response.data.files ?? []).map((file) => mapFile(file, this.driveType)),
      nextPageToken: response.data.nextPageToken ?? null,
    };
  }

  async getFile(fileId: string): Promise<DriveFile | null> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,md5Checksum,modifiedTime,createdTime,parents,webViewLink,trashed',
        ...this.corpusParams(),
      });
      return response.data.id ? mapFile(response.data, this.driveType) : null;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) return null;
      throw error;
    }
  }

  async download(fileId: string, range?: DriveRange): Promise<DriveByteStream> {
    const response = await (this.drive.files.get({
      fileId,
      alt: 'media',
      ...this.corpusParams(),
    }, { responseType: 'stream', headers: range ? { Range: `bytes=${range.start}-${range.end ?? ''}` } : undefined } as never) as unknown as Promise<{ data: NodeJS.ReadableStream; headers: Record<string, string | undefined> }>);
    const headers = response.headers;
    return {
      stream: response.data,
      sizeBytes: headers['content-length'] ? Number(headers['content-length']) : null,
      mimeType: headers['content-type'] ?? 'application/octet-stream',
      etag: headers.etag ?? null,
      supportsRanges: headers['accept-ranges'] === 'bytes' || Boolean(range),
    };
  }

  async getStartPageToken(): Promise<string> {
    const response = await this.drive.changes.getStartPageToken(this.corpusParams());
    if (!response.data.startPageToken) throw new Error('Drive did not return a start page token');
    return response.data.startPageToken;
  }

  async listChanges(pageToken: string, pageSize = 100): Promise<DriveChangePage> {
    const response = await this.drive.changes.list({
      pageToken,
      pageSize: Math.min(pageSize, 1000),
      includeRemoved: true,
      includeItemsFromAllDrives: this.driveType === 'shared_drive',
      supportsAllDrives: this.driveType === 'shared_drive',
      fields: 'nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,mimeType,size,md5Checksum,modifiedTime,createdTime,parents,webViewLink,trashed))',
      ...this.corpusParams(),
    });
    return {
      changes: (response.data.changes ?? []).flatMap((change) => change.fileId ? [{
        fileId: change.fileId,
        removed: Boolean(change.removed),
        file: change.file ? mapFile(change.file, this.driveType) : null,
        changeToken: response.data.nextPageToken ?? response.data.newStartPageToken ?? pageToken,
      }] : []),
      nextPageToken: response.data.nextPageToken ?? null,
      newStartPageToken: response.data.newStartPageToken ?? null,
    };
  }

  private corpusParams(): Record<string, unknown> {
    if (this.driveType !== 'shared_drive') return {};
    return {
      corpora: 'drive',
      driveId: this.sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    };
  }
}
