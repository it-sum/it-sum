import { Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { DriveOAuthStartResponseSchema, DriveSyncResponseSchema } from "@it-sum/shared";
import { CurrentUser, Public, Roles } from "../auth/auth.decorators.js";
import type { AuthUser } from "../auth/auth.types.js";
import { DriveService } from "./drive.service.js";

@ApiTags("drive")
@Controller("drive")
export class DriveController {
  constructor(private readonly drive: DriveService) {}

  @Roles("admin", "owner")
  @Get("oauth/start")
  @ApiOperation({ summary: "Start Google Drive OAuth consent" })
  async startOAuth(@CurrentUser() user: AuthUser) {
    return DriveOAuthStartResponseSchema.parse(await this.drive.createAuthorizationUrl(user));
  }

  @Public()
  @Get("oauth/callback")
  @ApiOperation({ summary: "Complete Google Drive OAuth consent" })
  async oauthCallback(@Query("code") code: string, @Query("state") state: string) {
    await this.drive.completeAuthorization(code, state);
    return { status: "connected" as const };
  }

  @Roles("admin", "owner")
  @Post("sync")
  @ApiOperation({ summary: "Run a Drive changes delta pass" })
  async sync(@CurrentUser() user: AuthUser) {
    const result = await this.drive.syncDelta(user);
    return DriveSyncResponseSchema.parse({
      runId: randomUUID(),
      status: "completed",
      imported: result.changes.filter((change) => !change.removed && change.file).length,
      updated: result.changes.filter((change) => !change.removed && !change.file).length,
      unavailable: result.changes.filter((change) => change.removed).length,
    });
  }
}
