import { Body, Controller, Get, Post } from '@nestjs/common';
import { progressUpdateRequestSchema, type ProgressUpdateRequest } from '@it-sum/shared';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { type ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post()
  update(@Body(new ZodValidationPipe(progressUpdateRequestSchema)) body: ProgressUpdateRequest, @CurrentUser() user: AuthenticatedUser) {
    return this.progress.update(body, user);
  }

  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.progress.overview(user);
  }
}
