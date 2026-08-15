import { google, type Auth, type drive_v3 } from "googleapis";
import type { Readable } from "node:stream";
import {
  type DriveAdapter,
  type DriveChangePage,
  type DriveDownload,
  type DriveFileMetadata,
  type DriveListOptions,
  toDriveFileMetadata,
} from "./index.js";

const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const FILE_FIELDS = "id,name,mimeType,size,md5Checksum,modifiedTime,parents,trashed,webViewLink";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GoogleDriveAdapterOptions {
  oauth: GoogleOAuthConfig;
  refreshToken?: string;
}

abstract class GoogleDriveAdapter implements DriveAdapter {
  abstract readonly mode: "oauth_user" | "shared_drive";

  protected readonly oauth2: Auth.OAuth2Client;
  protected readonly drive: drive_v3.Drive;
  protected readonly sharedDriveId: string | null;

  protected constructor(options: GoogleDriveAdapterOptions, sharedDriveId: string | null) {
    this.oauth2 = new google.auth.OAuth2(
      options.oauth.clientId,
      options.oauth.clientSecret,
      options.oauth.redirectUri,
    );
    if (options.refreshToken) {
      this.oauth2.setCredentials({ refresh_token: options.refreshToken });
    }
    this.drive = google.drive({ version: "v3", auth: this.oauth2 });
    this.sharedDriveId = sharedDriveId;
  }

  getStartPageToken(): Promise<string> {
    return this.drive.changes
      .getStartPageToken(this.changeScope())
      .then((response) => {
        const token = response.data.startPageToken;
        if (!token) {
          throw new Error("Google Drive did not return a start page token");
        }
        return token;
      });
  }

  async listChanges(pageToken: string, options: DriveListOptions = {}): Promise<DriveChangePage> {
    const response = await this.drive.changes.list({
      pageToken,
      pageSize: options.pageSize ?? 100,
      includeItemsFromAllDrives: options.includeItemsFromAllDrives ?? this.sharedDriveId !== null,
      supportsAllDrives: options.supportsAllDrives ?? this.sharedDriveId !== null,
      fields: "nextPageToken,newStartPageToken,changes(fileId,removed,file(" + FILE_FIELDS + "))",
      ...this.changeScope(),
    });

    return {
      changes: (response.data.changes ?? []).map((change) => ({
        fileId: change.fileId ?? "",
        removed: change.removed ?? false,
        file: change.file ? toDriveFileMetadata(change.file) : null,
      })).filter((change) => change.fileId.length > 0),
      nextPageToken: response.data.nextPageToken ?? null,
      newStartPageToken: response.data.newStartPageToken ?? null,
    };
  }

  async getFile(fileId: string): Promise<DriveFileMetadata> {
    const response = await this.drive.files.get({
      fileId,
      fields: FILE_FIELDS,
      supportsAllDrives: this.sharedDriveId !== null,
    });
    return toDriveFileMetadata(response.data);
  }

  async downloadFile(fileId: string, range?: string): Promise<DriveDownload> {
    const requestOptions = range
      ? { responseType: "stream" as const, headers: { Range: range } }
      : { responseType: "stream" as const };
    const response = await this.drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: this.sharedDriveId !== null,
      },
      requestOptions,
    );

    const headers = response.headers;
    const contentLengthHeader = headerValue(headers["content-length"]);
    return {
      stream: response.data as unknown as Readable,
      contentLength: contentLengthHeader ? Number(contentLengthHeader) : null,
      contentType: headerValue(headers["content-type"]),
      etag: headerValue(headers.etag),
      lastModified: headerValue(headers["last-modified"]),
      contentRange: headerValue(headers["content-range"]),
      statusCode: response.status,
      acceptRanges: "bytes",
    };
  }

  createAuthorizationUrl(state: string): string {
    return this.oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [DRIVE_READONLY_SCOPE],
      state,
    });
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiryDate: number | null;
  }> {
    const { tokens } = await this.oauth2.getToken(code);
    if (!tokens.access_token) {
      throw new Error("Google OAuth did not return an access token");
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiryDate: tokens.expiry_date ?? null,
    };
  }

  private changeScope(): drive_v3.Params$Resource$Changes$Getstartpagetoken {
    return this.sharedDriveId
      ? { driveId: this.sharedDriveId, supportsAllDrives: true }
      : {};
  }
}

export class OAuthUserDriveAdapter extends GoogleDriveAdapter {
  readonly mode = "oauth_user" as const;

  constructor(options: GoogleOAuthConfig & { refreshToken?: string }) {
    super(
      options.refreshToken
        ? { oauth: options, refreshToken: options.refreshToken }
        : { oauth: options },
      null,
    );
  }
}

export class SharedDriveAdapter extends GoogleDriveAdapter {
  readonly mode = "shared_drive" as const;

  constructor(options: GoogleOAuthConfig & { sharedDriveId: string; refreshToken?: string }) {
    super(
      options.refreshToken
        ? { oauth: options, refreshToken: options.refreshToken }
        : { oauth: options },
      options.sharedDriveId,
    );
  }
}

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}
