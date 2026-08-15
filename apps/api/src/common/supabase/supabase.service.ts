import { Injectable, type OnModuleInit } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv, requireEnv } from '../config/env';

/**
 * One service-role client for backend work. It is never exported to the web app,
 * and controllers still perform tenant/role checks before calling it. RLS remains
 * enabled as defence in depth for any future direct client access.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;

  onModuleInit() {
    const env = getEnv();
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  get admin(): SupabaseClient {
    if (this.client == null) {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    return this.client;
  }

  get url(): string {
    return requireEnv('SUPABASE_URL');
  }
}
