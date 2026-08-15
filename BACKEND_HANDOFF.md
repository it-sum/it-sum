# IT-SUM Backend Handoff

This repository now contains an additive Track B backend foundation for IT-SUM. The existing `README.md` and the empty `apps/web` area were left untouched, so the frontend track can be added or restored without conflicts.

## Implemented in this pass

| Area | Status | Notes |
|---|---|---|
| Monorepo | Complete | pnpm workspaces plus Turborepo with `apps/api`, `packages/shared`, and `packages/drive`. |
| Shared contracts | Complete | Zod schemas for health, tenant claims, resources, stream tokens, Drive OAuth, and Drive sync responses. |
| Supabase migrations | Drafted | Extensions, tenancy, identity, academic structure, library, Drive sync, progress, rewards, notifications, governance, and AI tables. |
| NestJS API | Bootstrapped | NestJS 11, JWKS verification, role and tenant guards, global Zod validation, pino redaction, health endpoint, resource endpoints, Drive OAuth, and stream proxy. |
| Drive adapters | Complete | `oauth_user` and `shared_drive` adapters expose one typed interface for metadata, delta changes, OAuth, and ranged downloads. |
| PDF streaming | Implemented | Short-lived signed stream tokens, Range forwarding, ETag handling, and private cache headers. |

## Verification

Run these commands from the repository root:

```bash
pnpm install
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
```

The local verification completed successfully for package builds and workspace typechecking before this handoff.

## Required credentials before staging use

The API is intentionally safe to boot in local development without secrets, but staging requires the following environment variables:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side tenant-scoped reads and Drive account persistence. |
| `SUPABASE_JWKS_URL` | Optional override; defaults to `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`. |
| `SUPABASE_ISSUER` | Optional issuer check for Supabase JWTs. |
| `STREAM_SIGNING_SECRET` | At least 32 characters; signs PDF stream and OAuth state tokens. |
| `DRIVE_TOKEN_ENCRYPTION_KEY` | At least 32 characters; encrypts Google refresh tokens before database storage. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL, normally `/api/v1/drive/oauth/callback`. |
| `DRIVE_MODE` | `oauth_user` or `shared_drive`. |
| `GOOGLE_SHARED_DRIVE_ID` | Required when `DRIVE_MODE=shared_drive`. |
| `DRIVE_ROOT_FOLDER_ID` | Optional root folder used by ingestion. |

## Next backend steps

The immediate next steps are to apply the Supabase migrations against the staging project, add the RLS policy migration, run the API against real Supabase and Google credentials, and then add integration tests for JWKS verification, tenant isolation, Drive OAuth callback handling, and ranged PDF streaming.
