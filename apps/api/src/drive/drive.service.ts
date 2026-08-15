import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  OAuthUserDriveAdapter,
  SharedDriveAdapter,
  type DriveAdapter,
  type DriveChange,
} from "@it-sum/drive";
import type { AuthUser } from "../auth/auth.types.js";
import type { Environment } from "../config/env.js";
import { ENVIRONMENT } from "../config/tokens.js";
import { SupabaseService } from "../common/supabase.service.js";
import { DriveTokenCryptoService } from "./token-crypto.service.js";
import { OAuthStateService } from "./oauth-state.service.js";

@Injectable()
export class DriveService {
  constructor(
    @Inject(ENVIRONMENT) private readonly environment: Environment,
    private readonly supabase: SupabaseService,
    private readonly tokenCrypto: DriveTokenCryptoService,
    private readonly oauthState: OAuthStateService,
  ) {}

  async createAuthorizationUrl(user: AuthUser): Promise<{ authorizationUrl: string; state: string }> {
    const adapter = this.createAdapter();
    const state = await this.oauthState.issue(user.sub, user.universityId);
    return {
      authorizationUrl: adapter.createAuthorizationUrl(state),
      state,
    };
  }

  async completeAuthorization(code: string, state: string): Promise<void> {
    const claims = await this.oauthState.verify(state);
    const adapter = this.createAdapter();
    const tokens = await adapter.exchangeCode(code);
    if (!tokens.refreshToken) {
      throw new ServiceUnavailableException("Google did not return a refresh token; repeat consent with prompt=consent");
    }
    const client = this.supabase.requireClient();
    const { error } = await client.from("drive_accounts").upsert({
      university_id: claims.universityId,
      account_email: null,
      mode: adapter.mode,
      encrypted_refresh_token: this.tokenCrypto.encrypt(tokens.refreshToken),
      shared_drive_id: this.environment.GOOGLE_SHARED_DRIVE_ID ?? null,
      root_folder_id: this.environment.DRIVE_ROOT_FOLDER_ID ?? null,
      status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "university_id,mode" });
    if (error) throw error;
  }

  async getDownload(user: AuthUser, driveFileId: string, range?: string) {
    const adapter = await this.adapterForUniversity(user.universityId);
    return adapter.downloadFile(driveFileId, range);
  }

  async syncDelta(user: AuthUser): Promise<{ changes: DriveChange[]; pageToken: string | null }> {
    const client = this.supabase.requireClient();
    const adapter = await this.adapterForUniversity(user.universityId);
    const { data: state, error: stateError } = await client
      .from("drive_sync_state")
      .select("page_token")
      .eq("university_id", user.universityId)
      .maybeSingle();
    if (stateError) throw stateError;

    let pageToken = typeof state?.page_token === "string" ? state.page_token : await adapter.getStartPageToken();
    const changes: DriveChange[] = [];
    let nextStartPageToken: string | null = null;

    while (true) {
      const page = await adapter.listChanges(pageToken, { pageSize: 100 });
      changes.push(...page.changes);
      if (page.nextPageToken) {
        pageToken = page.nextPageToken;
        continue;
      }
      nextStartPageToken = page.newStartPageToken ?? pageToken;
      break;
    }

    const { error: upsertError } = await client.from("drive_sync_state").upsert({
      university_id: user.universityId,
      page_token: nextStartPageToken,
      updated_at: new Date().toISOString(),
    }, { onConflict: "university_id" });
    if (upsertError) throw upsertError;
    return { changes, pageToken: nextStartPageToken };
  }

  private async adapterForUniversity(universityId: string): Promise<DriveAdapter> {
    const client = this.supabase.requireClient();
    const { data, error } = await client
      .from("drive_accounts")
      .select("mode,encrypted_refresh_token,shared_drive_id")
      .eq("university_id", universityId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    if (!data?.encrypted_refresh_token) {
      throw new ServiceUnavailableException("Drive has not been connected for this university");
    }

    const refreshToken = this.tokenCrypto.decrypt(String(data.encrypted_refresh_token));
    const mode = data.mode === "shared_drive" ? "shared_drive" : this.environment.DRIVE_MODE;
    return mode === "shared_drive"
      ? this.createAdapter(refreshToken, String(data.shared_drive_id ?? this.environment.GOOGLE_SHARED_DRIVE_ID ?? ""))
      : this.createAdapter(refreshToken);
  }

  private createAdapter(refreshToken?: string, sharedDriveId?: string): DriveAdapter {
    const oauth = {
      clientId: this.environment.GOOGLE_CLIENT_ID ?? "",
      clientSecret: this.environment.GOOGLE_CLIENT_SECRET ?? "",
      redirectUri: this.environment.GOOGLE_REDIRECT_URI,
      ...(refreshToken ? { refreshToken } : {}),
    };
    if (!oauth.clientId || !oauth.clientSecret) {
      throw new ServiceUnavailableException("Google OAuth client configuration is not available");
    }
    if (this.environment.DRIVE_MODE === "shared_drive" || sharedDriveId) {
      const driveId = sharedDriveId ?? this.environment.GOOGLE_SHARED_DRIVE_ID;
      if (!driveId) throw new ServiceUnavailableException("Shared Drive ID is not configured");
      return new SharedDriveAdapter({ ...oauth, sharedDriveId: driveId });
    }
    return new OAuthUserDriveAdapter(oauth);
  }
}
