import { Module } from '@nestjs/common';
import { QuizAttemptTokenService } from './quiz-attempt-token.service';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizAttemptTokenService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
