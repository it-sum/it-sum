import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Environment } from "../config/env.js";
import { Inject } from "@nestjs/common";
import { ENVIRONMENT } from "../config/tokens.js";

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient | null;

  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    this.client = environment.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(environment.SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;
  }

  requireClient(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException("Supabase service-role configuration is not available");
    }
    return this.client;
  }
}
