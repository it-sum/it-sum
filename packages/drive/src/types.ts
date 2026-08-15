import { z } from 'zod';

export const driveFileSchema = z.object({
  id: z.string().min(10),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().nullable(),
  md5Checksum: z.string().nullable(),
  modifiedTime: z.string().datetime({ offset: true }).nullable(),
  createdTime: z.string().datetime({ offset: true }).nullable(),
  parents: z.array(z.string()),
  webViewLink: z.string().url().nullable(),
  trashed: z.boolean(),
  driveType: z.enum(['my_drive', 'shared_drive']),
});
export type DriveFile = z.infer<typeof driveFileSchema>;

export interface DriveListOptions {
  folderId: string;
  pageToken?: string;
  pageSize?: number;
  includeTrashed?: boolean;
}

export interface DriveListResult {
  files: DriveFile[];
  nextPageToken: string | null;
}

export interface DriveChange {
  fileId: string;
  removed: boolean;
  file: DriveFile | null;
  changeToken: string;
}

export interface DriveChangePage {
  changes: DriveChange[];
  nextPageToken: string | null;
  newStartPageToken: string | null;
}

export interface DriveRange {
  start: number;
  end?: number;
}

export interface DriveByteStream {
  stream: NodeJS.ReadableStream;
  sizeBytes: number | null;
  mimeType: string;
  etag: string | null;
  supportsRanges: boolean;
}

export interface DriveAdapter {
  readonly mode: 'oauth_user' | 'shared_drive';
  listChildren(options: DriveListOptions): Promise<DriveListResult>;
  getFile(fileId: string): Promise<DriveFile | null>;
  download(fileId: string, range?: DriveRange): Promise<DriveByteStream>;
  getStartPageToken(): Promise<string>;
  listChanges(pageToken: string, pageSize?: number): Promise<DriveChangePage>;
}
