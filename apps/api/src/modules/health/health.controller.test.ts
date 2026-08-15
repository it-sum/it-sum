import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a stable liveness payload without touching external services', () => {
    const response = new HealthController().live();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('it-sum-api');
    expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('reports degraded readiness rather than pretending Supabase is configured', () => {
    const originalUrl = process.env.SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = new HealthController().ready();
    expect(response.status).toBe('degraded');
    expect(response.checks.configuration).toBe(false);

    if (originalUrl == null) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });
});
