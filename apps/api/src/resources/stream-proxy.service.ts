import { Injectable, NotFoundException } from "@nestjs/common";
import type { Response } from "express";
import type { AuthUser } from "../auth/auth.types.js";
import { DriveService } from "../drive/drive.service.js";
import { ResourcesService } from "./resources.service.js";
import { StreamTokenService } from "./stream-token.service.js";

@Injectable()
export class StreamProxyService {
  constructor(
    private readonly resources: ResourcesService,
    private readonly drive: DriveService,
    private readonly streamTokens: StreamTokenService,
  ) {}

  async send(resourceId: string, token: string, range: string | undefined, ifNoneMatch: string | undefined, response: Response): Promise<void> {
    const claims = await this.streamTokens.verify(token);
    if (claims.resourceId !== resourceId) {
      throw new NotFoundException("Resource not found");
    }
    const resource = await this.resources.getPublishedResource(resourceId, {
      sub: claims.userId,
      universityId: claims.universityId,
      role: "student",
    } as AuthUser);
    const download = await this.drive.getDownload(
      { sub: claims.userId, universityId: claims.universityId, role: "student" },
      resource.driveFileId,
      range,
    );

    if (download.etag && ifNoneMatch && stripQuotes(ifNoneMatch) === stripQuotes(download.etag)) {
      response.status(304).end();
      download.stream.destroy();
      return;
    }

    response.setHeader("Accept-Ranges", download.acceptRanges);
    response.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    response.setHeader("Content-Type", download.contentType ?? resource.mimeType);
    if (download.etag) response.setHeader("ETag", download.etag);
    if (download.lastModified) response.setHeader("Last-Modified", download.lastModified);
    if (download.contentLength !== null) response.setHeader("Content-Length", String(download.contentLength));
    if (download.contentRange) response.setHeader("Content-Range", download.contentRange);
    response.status(download.statusCode === 206 || range ? 206 : 200);
    download.stream.pipe(response);
  }
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^W\//, "").replace(/^\"|\"$/g, "");
}
