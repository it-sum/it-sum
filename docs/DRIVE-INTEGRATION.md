# Google Drive Integration

## Overview

Google Drive stores the original PDF files for IT-SUM. The browser never talks to Google Drive directly. The API chooses a typed adapter, validates tenant and role permissions, reads metadata or media, and exposes only the application-level resource and stream contracts.

The Drive package contains two modes:

| Mode | Description | Required configuration |
|---|---|---|
| `oauth_user` | A university administrator authorizes a user-owned Drive account. | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `DRIVE_TOKEN_ENCRYPTION_KEY`. |
| `shared_drive` | A university uses a Google Shared Drive. | OAuth variables plus `GOOGLE_SHARED_DRIVE_ID`. |

## Adapter boundary

Both adapters implement `DriveAdapter`:

```ts
interface DriveAdapter {
  readonly mode: "oauth_user" | "shared_drive";
  getStartPageToken(): Promise<string>;
  listChanges(pageToken: string, options?: DriveListOptions): Promise<DriveChangePage>;
  getFile(fileId: string): Promise<DriveFileMetadata>;
  downloadFile(fileId: string, range?: string): Promise<DriveDownload>;
  createAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<DriveOAuthTokens>;
}
```

The API does not depend on provider-specific response shapes. The adapter maps Google file metadata into `DriveFileMetadata` and maps response headers into the stream metadata required by the proxy.

## Google Cloud setup

Create a Google Cloud project for the environment, enable the Google Drive API, and create an OAuth client appropriate for the deployed API. Register an exact redirect URI:

```text
https://api.example.com/api/v1/drive/oauth/callback
```

For local development, register the local callback separately:

```text
http://localhost:3001/api/v1/drive/oauth/callback
```

The callback URI used by the application must exactly match a URI registered in the Google Cloud credential. Do not use wildcard callbacks for production.

The implementation requests read-only Drive scope. If future ingestion needs to write metadata or organize files, introduce the narrower additional scope deliberately and update the security review.

## OAuth flow

The administrator flow is:

1. An authenticated admin or owner calls `GET /api/v1/drive/oauth/start`.
2. The API signs a ten-minute OAuth state containing only the user ID, university ID, and purpose.
3. The browser visits the returned Google authorization URL.
4. Google redirects to `GET /api/v1/drive/oauth/callback` with `code` and `state`.
5. The API verifies the state signature and expiration.
6. The API exchanges the code for tokens.
7. The API encrypts the refresh token with AES-256-GCM.
8. The API upserts the `drive_accounts` record for the university and selected mode.

The callback must not accept `userId`, `universityId`, or role as independent query parameters. The signed state is the only source for those values. If state verification fails, reject the callback and do not persist anything.

## Refresh-token storage

The database stores `encrypted_refresh_token`, not the raw token. The key is derived from `DRIVE_TOKEN_ENCRYPTION_KEY` and must be available only to the API runtime. Rotate the encryption key through a planned re-encryption migration; do not silently replace it because existing records would become unreadable.

If Google does not return a refresh token, the API rejects the callback and instructs the administrator to repeat consent with an explicit consent prompt. Production should add an account-revocation workflow that marks a Drive account `revoked` and removes or re-encrypts associated credentials according to the project’s retention policy.

## Delta synchronization

The API stores one Drive changes page token per university in `drive_sync_state`. A sync pass:

1. Loads the active Drive account.
2. Decrypts the refresh token in memory.
3. Uses the saved page token, or obtains an initial start page token.
4. Reads all available pages from `changes.list`.
5. Accumulates file additions, updates, and removals.
6. Saves the new start page token only after the page sequence completes.
7. Returns counts through the sync response contract.

A future worker should persist a `drive_sync_runs` row around this process, retry transient provider failures with backoff, and write a conflict record when a change cannot be mapped safely. The page token must not be advanced after a partially processed page unless the ingestion design guarantees idempotent replay.

## Resource ingestion roadmap

The current API reports changes but does not yet perform complete content ingestion. The ingestion worker should:

1. Ignore unsupported MIME types and record the reason.
2. Normalize folder paths and filenames using deterministic rules.
3. Upsert folder and resource metadata using `(university_id, drive_file_id)`.
4. Use Drive checksums and modified timestamps to skip unchanged files.
5. Classify course, semester, material kind, exam phase, and contributor with confidence values.
6. Mark removed Drive files `unavailable` rather than deleting audit history.
7. Download PDFs only when the metadata requires text extraction or checksum repair.
8. Extract text, measure quality, split document chunks, and write embeddings.
9. Publish only after validation and any required administrator review.
10. Record audit events and sync-run counts.

## PDF streaming

The stream proxy accepts a short-lived application token and an optional `Range` header. It resolves the resource and requests media from Drive with the same range. It forwards `Content-Type`, `Content-Length`, `Content-Range`, `ETag`, and `Last-Modified` where available and adds `Accept-Ranges: bytes` and private cache directives.

The proxy should never cache a private PDF publicly. CDN configuration must respect the `private` cache directive and must not key content solely by resource ID without considering the signed token and tenant context.

The frontend should renew a stream token when it expires. It should save the last page or reading position through the progress API rather than storing the token as durable user data.

## Failure handling

| Failure | API behavior | Operator action |
|---|---|---|
| OAuth state invalid | Reject callback. | Ask the administrator to restart the flow. |
| Refresh token missing | Reject callback. | Repeat consent with a consent prompt. |
| Google access revoked | Mark account error or revoked. | Reconnect Drive and inspect audit records. |
| Drive file removed | Mark resource unavailable during ingestion. | Review references and notify affected users if necessary. |
| Range request rejected | Return a safe upstream error or full stream only when policy allows. | Inspect Drive response and viewer compatibility. |
| Page token invalid | Reset through a controlled full sync. | Record an audit event and run reconciliation. |
| Encryption key unavailable | Refuse Drive operations. | Restore the correct secret; do not bypass encryption. |

## References

[1]: https://developers.google.com/drive/api/guides/about-sdk "Google Drive API documentation"
[2]: https://developers.google.com/identity/protocols/oauth2 "Google OAuth 2.0 documentation"
[3]: https://developers.google.com/drive/api/guides/manage-changes "Google Drive changes documentation"
[4]: https://developers.google.com/drive/api/guides/manage-downloads "Google Drive download documentation"
