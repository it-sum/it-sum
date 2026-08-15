import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/auth/jwt.guard';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { DriveModule } from './modules/drive/drive.module';
import { HealthModule } from './modules/health/health.module';
import { LibraryModule } from './modules/library/library.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { ProgressModule } from './modules/progress/progress.module';

@Module({
  imports: [SupabaseModule, HealthModule, AuthModule, AcademicsModule, DriveModule, LibraryModule, QuizzesModule, ProgressModule],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AppModule {}
