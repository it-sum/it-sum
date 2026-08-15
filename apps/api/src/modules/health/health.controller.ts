import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/auth.decorators';
import { getEnv } from '../../common/config/env';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  live() {
    return {
      status: 'ok',
      service: 'it-sum-api',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  ready() {
    const env = getEnv();
    return {
      status: env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? 'ready' : 'degraded',
      checks: {
        configuration: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
        jwks: Boolean(env.SUPABASE_JWKS_URL || env.SUPABASE_URL),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
