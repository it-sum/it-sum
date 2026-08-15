import { Controller, Get, Headers, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  browse(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.browse(query, user);
  }

  @Get('resources/:id/stream-ticket')
  streamTicket(@Param('id') resourceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.issueStreamTicket(resourceId, user);
  }

  @Get('resources/:id/stream')
  async stream(
    @Param('id') resourceId: string,
    @Query('ticket') ticket: string,
    @Headers('range') rangeHeader: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    const range = this.parseRange(rangeHeader);
    const result = await this.libraryService.streamResource(resourceId, ticket, user, range);
    response.status(range ? 206 : 200);
    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Accept-Ranges', 'bytes');
    if (result.etag) response.setHeader('ETag', result.etag);
    if (result.sizeBytes != null) response.setHeader('Content-Length', String(result.sizeBytes));
    if (range && result.totalSizeBytes != null && result.sizeBytes != null) {
      const end = range.end ?? range.start + result.sizeBytes - 1;
      response.setHeader('Content-Range', `bytes ${range.start}-${end}/${result.totalSizeBytes}`);
    }
    response.setHeader('Cache-Control', 'private, max-age=300');
    result.stream.pipe(response);
  }

  private parseRange(value?: string): { start: number; end?: number } | undefined {
    if (!value) return undefined;
    const match = /^bytes=(\d+)-(\d*)$/.exec(value);
    if (!match) return undefined;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : undefined;
    if (!Number.isSafeInteger(start) || (end != null && !Number.isSafeInteger(end)) || (end != null && end < start)) return undefined;
    return { start, end };
  }
}
