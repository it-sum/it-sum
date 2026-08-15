# IT-SUM Backend Handoff

## Purpose

This document is the concise handoff for the backend track. The complete project documentation is in the [`docs/`](docs/) directory and the root [`README.md`](README.md) is the primary onboarding entry point.

## Current implementation

The repository contains an additive Track B backend foundation organized as a pnpm workspace and Turborepo monorepo.

| Area | Status | Implementation |
|---|---|---|
| Monorepo | Complete | `apps/api`, `packages/shared`, and `packages/drive` are configured. |
| Shared contracts | Complete foundation | Zod schemas for identity, health, resources, pagination, stream tokens, Drive OAuth, and Drive sync. |
| NestJS API | Complete foundation | NestJS 11 bootstrap, global validation, JWKS verification, role and tenant guards, pino redaction, health endpoint, resource routes, Drive routes, and stream proxy. |
| OAuth-user Drive adapter | Implemented | Authorization URL, code exchange, metadata, changes pages, and ranged downloads. |
| Shared Drive adapter | Implemented | Shared Drive file listing and ranged downloads behind the same interface. |
| Stream token | Implemented | Short-lived signed token bound to resource, user, and university. |
| Refresh-token encryption | Implemented | AES-256-GCM encryption service for persistence. |
| Supabase migrations | Schema foundation | Extensions and domain tables are present in ordered SQL migrations. |
| RLS policies | Pending | Add and review the dedicated policy migration before staging or production. |
| Ingestion worker | Pending | The sync route reads changes; complete PDF extraction and resource ingestion remain. |
| Integration tests | Pending | Add Supabase, JWKS, OAuth callback, tenant-isolation, and Range/ETag tests. |
| Domain APIs | Implemented foundation | Users, academics, videos, quizzes, progress, rewards, notifications, support, and AI conversation routes are now wired to the schema-backed tables. |

## Verification

The verified local sequence is:

```bash
pnpm install
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
pnpm test
```

For a full deployment check, follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). A green TypeScript build does not prove that provider credentials, Supabase RLS, Google OAuth, or tenant isolation are configured correctly.

## Documentation map

| Document | Use it when |
|---|---|
| [`README.md`](README.md) | Onboarding, architecture overview, quick start, and project status. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Reviewing boundaries, request flows, and module responsibilities. |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Setting up a local environment or debugging the API. |
| [`docs/API.md`](docs/API.md) | Integrating the frontend with the v1 API. |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Applying migrations, designing tables, or completing RLS. |
| [`docs/DRIVE-INTEGRATION.md`](docs/DRIVE-INTEGRATION.md) | Configuring Google OAuth, Drive modes, sync, or PDF delivery. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Reviewing secrets, authorization, privacy, and incident response. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deploying to staging or production. |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Making and reviewing changes. |
| [`docs/AGENT-COLLABORATION-PROMPT.md`](docs/AGENT-COLLABORATION-PROMPT.md) | Sending the other agent a precise progress and integration prompt. |

## Required staging credentials

The code must receive these values from the deployment secret manager. They must not be committed:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access. |
| `SUPABASE_JWKS_URL` and `SUPABASE_ISSUER` | JWT verification configuration. |
| `STREAM_SIGNING_SECRET` | Signs short-lived stream and OAuth state tokens. |
| `DRIVE_TOKEN_ENCRYPTION_KEY` | Encrypts Google refresh tokens at rest. |
| `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` | Google OAuth client. |
| `GOOGLE_REDIRECT_URI` | Exact registered OAuth callback. |
| `DRIVE_MODE` | `oauth_user` or `shared_drive`. |
| `GOOGLE_SHARED_DRIVE_ID` | Required for Shared Drive mode. |
| `PUBLIC_API_BASE_URL` | HTTPS API origin used in absolute stream URLs. |

## Immediate next steps

The next developer should first add the RLS helper functions and policies, apply the complete migration set to a disposable Supabase project, create integration tests with two university tenants, and verify the API against real staging credentials. After that, implement an idempotent Drive ingestion worker that updates resources, handles removals and conflicts, extracts PDF text, and creates document chunks and embeddings.

The frontend developer should consume `@it-sum/shared`, use the stream-token sequence in [`docs/API.md`](docs/API.md), and avoid direct Google Drive access. Any contract change should be made in the shared package first.
