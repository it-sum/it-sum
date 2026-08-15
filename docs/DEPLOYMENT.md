# Deployment Guide

## Deployment principle

Deploy IT-SUM in controlled stages. Build and typecheck the exact commit, apply database migrations to a staging project, verify tenant isolation and provider integrations, and only then promote the API. Database migrations and credential changes must be independently reviewable.

## Staging prerequisites

Before deploying to staging, prepare:

| Requirement | Verification |
|---|---|
| Supabase project | Project URL and branch are recorded. |
| Database backup | A recent backup or disposable branch exists. |
| Migration runner | The approved Supabase CLI or CI migration workflow is available. |
| JWT configuration | JWKS URL, issuer, and audience are confirmed. |
| Google OAuth client | Staging callback URI is registered exactly. |
| Drive source | OAuth-user or Shared Drive mode is selected. |
| Secret manager | Service-role key, signing secret, encryption key, and OAuth secret are stored out of Git. |
| Hostname | `PUBLIC_API_BASE_URL` resolves over HTTPS. |
| Health probe | The platform can reach `/api/v1/health`. |

## Build and release

Build from a clean checkout of the release commit:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
```

The deployment image or runtime should contain the compiled API and package dependencies but not local `.env` files, source-control metadata, test fixtures containing personal data, or unused provider keys.

## Environment configuration

Set the following in the staging or production secret manager:

```dotenv
NODE_ENV=production
PORT=3001
API_PREFIX=api/v1
SERVICE_VERSION=0.1.0
PUBLIC_API_BASE_URL=https://api.example.com

SUPABASE_URL=https://project.supabase.co
SUPABASE_JWKS_URL=https://project.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_ISSUER=https://project.supabase.co/auth/v1
SUPABASE_SERVICE_ROLE_KEY=<secret>

STREAM_SIGNING_SECRET=<random-secret-at-least-32-characters>
STREAM_TOKEN_TTL_SECONDS=300
DRIVE_TOKEN_ENCRYPTION_KEY=<random-secret-at-least-32-characters>

DRIVE_MODE=oauth_user
GOOGLE_CLIENT_ID=<secret>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_REDIRECT_URI=https://api.example.com/api/v1/drive/oauth/callback
GOOGLE_SHARED_DRIVE_ID=
DRIVE_ROOT_FOLDER_ID=
```

Use a separate Supabase project, Google OAuth client, signing secret, and encryption key for staging and production. Do not copy production refresh tokens into staging.

## Migration sequence

Apply migrations in order and record the resulting version:

```text
0001_extensions.sql
0002_tenancy_identity_structure_library.sql
0003_operational_ai.sql
<next migration: RLS policies and helper functions>
```

Do not release the current migration set to production without adding and reviewing the RLS policy migration. Validate that service-role operations are intentionally limited and that authenticated users cannot cross tenant boundaries.

## Smoke tests

After deployment, run the following checks:

```bash
curl -fsS https://api.example.com/api/v1/health
```

Then validate with a staging user:

1. Sign in through Supabase Auth.
2. Fetch the resource list with the access token.
3. Request a stream token for a published resource.
4. Open the returned URL and confirm `Content-Type: application/pdf`.
5. Repeat with a `Range: bytes=0-1023` request and confirm partial-content behavior when Drive supports it.
6. Start the Drive OAuth flow as an owner.
7. Confirm the callback stores only an encrypted refresh token.
8. Run a Drive sync and verify the run status and page-token update.
9. Attempt a cross-tenant resource request and confirm rejection.
10. Confirm no sensitive token or PDF URL appears in logs.

## Observability

Monitor health-check failures, 5xx rates, authentication failures, tenant-denial counts, Drive provider errors, stream latency, partial-content failures, sync-run durations, unavailable-file counts, and AI budget rejections. Logs should use correlation IDs and safe error codes, not raw credentials or private content.

Alert on repeated JWKS fetch failures, service-role connection failures, encryption-key failures, invalid OAuth state spikes, Drive token revocations, and database policy errors.

## Rollback

Application rollback is safe when the previous build remains compatible with the current database schema. Database rollback requires a reviewed migration-specific plan; do not blindly down-migrate production tables containing user progress, quiz attempts, audit events, or Drive state.

If a migration causes a critical problem:

1. Stop further deployment.
2. Disable the affected route or worker if possible.
3. Preserve logs and migration metadata.
4. Restore the service to the previous compatible build.
5. Apply a forward corrective migration or restore a verified backup.
6. Re-run tenant and authorization smoke tests.
7. Record the incident and update the migration review checklist.

## Production readiness gate

The release owner should approve production only after RLS tests, OAuth callback tests, stream range tests, secret checks, backup checks, migration verification, and frontend compatibility checks pass. The approval should include the exact Git commit, migration version, Supabase project, Google OAuth client, and rollback contact.

## References

[1]: https://supabase.com/docs/guides/cli/local-development "Supabase CLI and migration documentation"
[2]: https://docs.nestjs.com/recipes/terminus "NestJS health-check documentation"
[3]: https://cloud.google.com/architecture/devops/devops-tech-release-strategies "Google Cloud release strategies"
