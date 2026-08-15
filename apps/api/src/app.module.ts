import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/auth/jwt.guard';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [SupabaseModule, HealthModule, AuthModule, AcademicsModule],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AppModule {}
