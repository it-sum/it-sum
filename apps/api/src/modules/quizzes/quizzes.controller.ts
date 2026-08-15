import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { autosaveAnswersRequestSchema, submitAttemptRequestSchema, type AutosaveAnswersRequest, type SubmitAttemptRequest } from '@it-sum/shared';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { type QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get()
  list(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.quizzes.list(query, user);
  }

  @Get(':id')
  start(@Param('id') quizId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quizzes.start(quizId, user);
  }

  @Post('attempts/:attemptId/autosave')
  autosave(@Param('attemptId') attemptId: string, @Body(new ZodValidationPipe(autosaveAnswersRequestSchema)) body: AutosaveAnswersRequest, @CurrentUser() user: AuthenticatedUser) {
    return this.quizzes.autosave(attemptId, body, user);
  }

  @Post('attempts/:attemptId/submit')
  submit(@Param('attemptId') attemptId: string, @Body(new ZodValidationPipe(submitAttemptRequestSchema)) body: SubmitAttemptRequest, @CurrentUser() user: AuthenticatedUser) {
    return this.quizzes.submit(attemptId, body, user);
  }
}
