import type { drive_v3 } from "googleapis";
import type { Readable } from "node:stream";

export type DriveMode = "oauth_user" | "shared_drive";

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  md5Checksum: string | null;
  modifiedTime: string | null;
  parents: string[];
  trashed: boolean;
  webViewLink: string | null;
}

export interface DriveChange {
  fileId: string;
  removed: boolean;
  file: DriveFileMetadata | null;
}

export interface DriveChangePage {
  changes: DriveChange[];
  nextPageToken: string | null;
  newStartPageToken: string | null;
}

export interface DriveDownload {
  stream: Readable;
  contentLength: number | null;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  contentRange: string | null;
  statusCode: number;
  acceptRanges: "bytes";
}

export interface DriveListOptions {
  pageSize?: number;
  includeItemsFromAllDrives?: boolean;
  supportsAllDrives?: boolean;
}

export interface DriveAdapter {
  readonly mode: DriveMode;
  getStartPageToken(): Promise<string>;
  listChanges(pageToken: string, options?: DriveListOptions): Promise<DriveChangePage>;
  getFile(fileId: string): Promise<DriveFileMetadata>;
  downloadFile(fileId: string, range?: string): Promise<DriveDownload>;
  createAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string | null; expiryDate: number | null }>;
}

export type DriveFilesResource = drive_v3.Schema$File;

export function toDriveFileMetadata(file: DriveFilesResource): DriveFileMetadata {
  if (!file.id || !file.name || !file.mimeType) {
    throw new Error("Drive file response is missing an id, name, or mimeType");
  }

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.size ? Number(file.size) : null,
    md5Checksum: file.md5Checksum ?? null,
    modifiedTime: file.modifiedTime ?? null,
    parents: file.parents ?? [],
    trashed: file.trashed ?? false,
    webViewLink: file.webViewLink ?? null,
  };
}

export { OAuthUserDriveAdapter, SharedDriveAdapter } from "./google-adapters.js";
export type { GoogleOAuthConfig } from "./google-adapters.js";
