# IT-SUM

**IT-SUM** is a bilingual, multi-university learning platform for information-technology students. It brings course summaries, searchable PDF resources, quizzes, progress tracking, videos, roadmaps, notifications, rewards, and optional AI-assisted study features into one web experience.

The project is organized as a contract-first **pnpm workspace and Turborepo monorepo**. The backend foundation is implemented in NestJS 11, shared request and response contracts are defined with Zod, Google Drive is isolated behind typed adapters, and Supabase provides authentication, tenancy, relational data, vector search, and operational persistence.

> **Current status:** Track B backend foundation is implemented and pushed to `main`. The repository currently contains the backend packages and an untouched frontend integration boundary. Real Supabase and Google credentials, the final Row Level Security policy migration, and staging integration tests are still required before production deployment.

## Contents

- [Product scope](#product-scope)
- [Repository status](#repository-status)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [Backend capabilities](#backend-capabilities)
- [Database and migrations](#database-and-migrations)
- [API documentation](#api-documentation)
- [Google Drive integration](#google-drive-integration)
- [Security model](#security-model)
- [Testing and verification](#testing-and-verification)
- [Deployment](#deployment)
- [Documentation map](#documentation-map)
- [Development workflow](#development-workflow)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License and project purpose](#license-and-project-purpose)

## Product scope

IT-SUM is designed for universities that want to share a reusable educational platform with their students. Each university is represented as a tenant. A tenant may contain departments, batches, semesters, courses, course aliases, material types, exam phases, contributors, Drive folders, resources, quizzes, videos, progress records, rewards, notifications, audit records, and AI usage data.

Students can browse approved resources, open PDFs through the platform, save progress, complete quizzes, watch course videos, follow learning roadmaps, bookmark content, and receive reminders. Administrators and owners can manage the academic structure, approve users, connect the university’s Drive source, review content, publish resources, manage quizzes, and inspect operational activity.

The product is intentionally designed as a non-profit educational system. A future frontend should preserve bilingual behavior, Arabic and English typography, accessible light and dark themes, responsive layouts, and a clear separation between student and administrator workflows.

## Repository status

| Area | Current state | Notes |
|---|---|---|
| Monorepo | Implemented | pnpm workspaces and Turborepo are configured. |
| Shared contracts | Implemented | `packages/shared` is the source of truth for API payloads. |
| NestJS API | Implemented | Authentication, validation, health, resource, Drive, and streaming foundations are present. |
| Drive adapters | Implemented | OAuth-user and Shared Drive modes share one typed interface. |
| Supabase schema | Migration draft implemented | Extensions and domain tables are present; the dedicated RLS policy migration remains to be applied and reviewed. |
| Frontend | Integration boundary preserved | Existing frontend work should be added under `apps/web` without changing the backend package contracts. |
| Production credentials | Pending | Supabase service-role access and Google OAuth secrets must be supplied through deployment secret storage. |
| Staging verification | Pending | Apply migrations and run integration tests against a non-production tenant before release. |

## Architecture

The intended request path is:

```text
Browser / apps/web
        |
        | HTTPS + Supabase bearer JWT
        v
NestJS API / apps/api
        |
        +--> JWKS verification, role guard, tenant guard
        |
        +--> shared Zod contracts / packages/shared
        |
        +--> Supabase: auth claims, tenant data, progress, AI, audit
        |
        +--> Drive adapters / packages/drive
                 |
                 +--> OAuth-user Drive
                 +--> Shared Drive
```

The API verifies Supabase-issued JWTs against the project JWKS endpoint. The verified `sub`, `university_id`, and `role` claims become the request identity. The tenant guard rejects cross-university identifiers supplied in headers, route parameters, or query parameters. Resource reads are also filtered by the authenticated university ID in the service layer.

PDF bytes are not copied into the application database. Instead, the API issues a short-lived signed stream token after checking that the user can access a published resource. The stream endpoint validates the token, resolves the resource’s Drive file ID, forwards an optional HTTP Range header to Google Drive, and returns ETag, Last-Modified, Content-Range, Content-Length, and private cache headers where available.

The architecture follows the official NestJS module and provider model [1], Supabase JWT and Row Level Security patterns [2], Google Drive file and change APIs [3], Zod schema validation [4], and Turborepo workspace orchestration [5].

## Repository structure

```text
.
├── apps/
│   └── api/                         # NestJS 11 HTTP API
│       └── src/
│           ├── auth/                # JWKS verifier and guards
│           ├── common/              # Supabase service wrapper
│           ├── config/              # Environment parsing and DI tokens
│           ├── drive/               # OAuth, sync, token crypto, controllers
│           ├── health/              # Public liveness endpoint
│           ├── resources/           # Resource listing and PDF streaming
│           ├── app.module.ts
│           └── main.ts
├── packages/
│   ├── shared/                      # Zod schemas and contract types
│   └── drive/                       # OAuth-user and Shared Drive adapters
├── supabase/
│   └── migrations/                  # Ordered SQL migrations
├── docs/                            # Detailed architecture and operations docs
├── BACKEND_HANDOFF.md               # Track B implementation handoff
├── package.json                     # Root scripts
├── pnpm-workspace.yaml              # Workspace package globs
├── turbo.json                       # Task pipeline
└── tsconfig.json                    # Strict TypeScript baseline
```

## Quick start

The following commands assume Node.js 22 or a compatible current LTS release and pnpm 9.15.5 or newer. Install dependencies, build the packages that publish declarations, run the typecheck, and then build the entire workspace:

```bash
git clone https://github.com/it-sum/it-sum.git
cd it-sum
pnpm install
cp .env.example .env  # create this file locally from the variables below
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
```

The current repository does not commit an `.env.example` file because secret values must be supplied by the deployment owner. Create one locally or use the deployment platform’s secret manager. Never commit `.env`, refresh tokens, service-role keys, or OAuth client secrets.

To start the API in development mode after configuring the environment:

```bash
pnpm --filter @it-sum/api start:dev
```

The API listens on port `3001` by default and uses the `api/v1` prefix by default. The health endpoint is available at `http://localhost:3001/api/v1/health`, and the OpenAPI UI is available at `http://localhost:3001/api/v1/docs`.

## Environment configuration

The API validates environment variables at startup. The following table describes the supported configuration. Values marked as required for staging may be omitted in local development, but the related feature will not work without them.

| Variable | Required for staging | Description |
|---|---:|---|
| `NODE_ENV` | Yes | `development`, `test`, or `production`. |
| `PORT` | No | HTTP port; defaults to `3001`. |
| `API_PREFIX` | No | Global route prefix; defaults to `api/v1`. |
| `SERVICE_VERSION` | No | Health and OpenAPI version string; defaults to `0.1.0`. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_JWKS_URL` | Recommended | JWKS endpoint; defaults to `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`. |
| `SUPABASE_ISSUER` | Recommended | JWT issuer validation value. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase access. Store only in secret storage. |
| `STREAM_SIGNING_SECRET` | Yes | At least 32 characters; signs stream and OAuth state tokens. |
| `STREAM_TOKEN_TTL_SECONDS` | No | Short-lived token lifetime between 30 and 900 seconds; defaults to 300. |
| `DRIVE_TOKEN_ENCRYPTION_KEY` | Yes for OAuth-user mode | At least 32 characters; encrypts refresh tokens with AES-256-GCM. |
| `DRIVE_MODE` | Yes | `oauth_user` or `shared_drive`. |
| `GOOGLE_CLIENT_ID` | Yes for Drive | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes for Drive | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Yes for Drive | Callback URL, normally `/api/v1/drive/oauth/callback`. |
| `GOOGLE_SHARED_DRIVE_ID` | Shared Drive only | Shared Drive identifier when `DRIVE_MODE=shared_drive`. |
| `DRIVE_ROOT_FOLDER_ID` | Optional | Root folder used by future ingestion workflows. |

For a complete explanation of the variables and secret-handling requirements, read [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md), [`docs/DRIVE-INTEGRATION.md`](docs/DRIVE-INTEGRATION.md), and [`docs/SECURITY.md`](docs/SECURITY.md).

## Backend capabilities

The current API foundation includes a public health endpoint, Supabase JWKS verification, role and tenant guards, global Zod validation, resource pagination and filtering, short-lived signed PDF tokens, range-aware Drive streaming, ETag handling, Google OAuth state signing, encrypted refresh-token persistence, Drive change-page synchronization, and role-protected administrator routes.

The shared contract package currently defines role and tenant claims, API errors, health responses, pagination, resources, resource filters, stream token responses, Drive OAuth responses, Drive sync responses, and an API contract version. The API should import these schemas rather than creating duplicate DTO definitions.

## Database and migrations

Supabase migrations are ordered under `supabase/migrations`:

| Migration | Scope |
|---|---|
| `0001_extensions.sql` | Enables `vector`, `pg_trgm`, `unaccent`, `pg_cron`, and `pg_net`, and creates the private schema. |
| `0002_tenancy_identity_structure_library.sql` | Creates universities, profiles, preferences, invitations, approval requests, departments, batches, semesters, courses, aliases, facets, folders, resources, bookmarks, collections, and search indexes. |
| `0003_operational_ai.sql` | Creates Drive accounts and sync state, versions and conflicts, videos, quizzes, attempts, progress, streaks, rewards, notifications, governance, audit, document chunks, AI conversations, AI usage, budgets, provider keys, cache, and feedback. |

The migrations use tenant keys such as `university_id` throughout the domain schema. Before applying them to a shared staging or production project, the team must add and review explicit RLS policies for every table that contains tenant or user data. The API’s tenant guard is a defense-in-depth control; it must not be treated as a replacement for database-level RLS.

For the table inventory, indexing choices, migration order, and RLS checklist, read [`docs/DATABASE.md`](docs/DATABASE.md).

## API documentation

The API uses the global prefix `api/v1`. Protected routes require:

```http
Authorization: Bearer <supabase-access-token>
```

The current route surface is summarized below.

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Liveness response. |
| `GET` | `/api/v1/resources` | Authenticated | Paginated published resources for the current tenant. |
| `GET` | `/api/v1/resources/:id/stream-token` | Authenticated | Issues a short-lived PDF stream token. |
| `GET` | `/api/v1/resources/:id/stream?token=...` | Signed token | Streams the published Drive PDF with optional Range support. |
| `GET` | `/api/v1/drive/oauth/start` | Admin or owner | Creates the Google OAuth authorization URL. |
| `GET` | `/api/v1/drive/oauth/callback` | Public callback | Verifies OAuth state and persists an encrypted refresh token. |
| `POST` | `/api/v1/drive/sync` | Admin or owner | Reads a Drive changes delta using the saved page token. |

Example resource query:

```http
GET /api/v1/resources?page=1&pageSize=24&search=network&materialKindId=<uuid>
Authorization: Bearer <token>
```

The API documentation UI is generated from the NestJS application at `/api/v1/docs`. The detailed contract examples and known integration caveats are documented in [`docs/API.md`](docs/API.md).

## Google Drive integration

The Drive package exposes a single `DriveAdapter` interface and two implementations:

| Adapter | Use case |
|---|---|
| `OAuthUserDriveAdapter` | A university administrator authorizes access to a user-owned Drive account. |
| `SharedDriveAdapter` | A university uses a Shared Drive and supplies `GOOGLE_SHARED_DRIVE_ID`. |

The adapter supports metadata reads, Drive changes pages, start-page-token retrieval, OAuth authorization URLs, code exchange, and ranged file downloads. The API stores only an encrypted refresh token in `drive_accounts`; access tokens remain managed by the Google client at runtime.

The current sync endpoint persists the Drive page token and reports the number of added, updated, and removed changes. A later ingestion worker must normalize folder paths, upsert resources, classify course facets, process PDF text, and write document chunks and embeddings. The current endpoint is therefore a synchronization foundation, not a complete content-ingestion pipeline.

Read [`docs/DRIVE-INTEGRATION.md`](docs/DRIVE-INTEGRATION.md) for OAuth setup, callback configuration, change handling, streaming behavior, and ingestion follow-up work.

## Security model

The backend follows a layered security model:

1. Supabase signs the user access token.
2. The API verifies the signature and claims against the configured JWKS endpoint.
3. `JwtAuthGuard` authenticates every route except those explicitly marked public.
4. `RolesGuard` checks `student`, `admin`, and `owner` metadata.
5. `TenantGuard` rejects mismatched tenant values in headers, route parameters, and query parameters.
6. Supabase queries filter by `university_id` and the database must enforce equivalent RLS policies.
7. Stream tokens bind a resource ID, user ID, and university ID and expire quickly.
8. Drive refresh tokens are encrypted before persistence.
9. Pino redacts bearer tokens, cookies, answer keys, and AI prompt fields from logs.

Read [`docs/SECURITY.md`](docs/SECURITY.md) before deploying or adding a new endpoint.

## Testing and verification

Run the complete local verification sequence from the repository root:

```bash
pnpm install
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
pnpm test
```

The current verification focuses on TypeScript compilation and package builds. Integration tests should be added before staging for JWKS verification, role and tenant isolation, Supabase RLS behavior, OAuth callback replay protection, refresh-token encryption, Drive range forwarding, ETag responses, and unavailable or deleted Drive files.

## Deployment

A deployment should build the workspace in dependency order, provide secrets through the platform secret manager, apply Supabase migrations through a reviewed migration workflow, configure the Google OAuth callback URL, and run a health check against `/api/v1/health`.

Do not run a production deployment until the RLS migration has been reviewed, the service-role key is scoped to the intended project, Google OAuth consent and redirect URIs are configured, and the API has been tested against a staging tenant. Read [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the release checklist.

## Documentation map

| Document | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System boundaries, request flows, module responsibilities, and data ownership. |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Local setup, commands, environment variables, debugging, and coding conventions. |
| [`docs/API.md`](docs/API.md) | Endpoint reference, authentication requirements, query parameters, and response examples. |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Migration inventory, tenant data model, indexes, RLS plan, and operational tables. |
| [`docs/DRIVE-INTEGRATION.md`](docs/DRIVE-INTEGRATION.md) | OAuth-user mode, Shared Drive mode, sync behavior, PDF streaming, and ingestion roadmap. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Authentication, authorization, secrets, logging, privacy, and review checklist. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Staging and production deployment sequence and rollback guidance. |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Branching, commit, review, testing, and contract-first contribution rules. |
| [`BACKEND_HANDOFF.md`](BACKEND_HANDOFF.md) | Short Track B handoff for the backend/frontend developers. |

## Development workflow

Make changes in a focused branch, update shared contracts before changing dependent API behavior, and run package builds plus the workspace typecheck before opening a pull request. Database changes must be additive migrations with explicit rollback considerations. New authenticated endpoints require both a role decision and a tenant-isolation test plan.

The frontend should consume the shared package rather than duplicating payload shapes. If a frontend route needs a new field, update the Zod schema, update the API mapping, document the change, and then update the frontend client.

## Roadmap

The next backend milestones are to add the dedicated RLS policy migration, apply and validate migrations in a staging Supabase project, add integration tests, implement the Drive ingestion worker, normalize folder and filename classification, process PDF text and embeddings, complete quiz and progress endpoints, add notification scheduling, and connect the frontend to the stable v1 contracts.

The frontend track should add `apps/web` without modifying the API’s shared contract boundaries. Future AI features should use retrieval citations from `document_chunks`, enforce budgets from `ai_budgets`, persist usage events, and expose feedback through `ai_feedback`.

## Contributing

Please read [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) before opening a pull request. Contributions should preserve tenant isolation, avoid logging sensitive content, keep migrations reviewable, and include tests or explicit verification steps for behavior changes.

## License and project purpose

IT-SUM is intended to be a non-profit educational platform. Add the final project license before distributing the source code publicly. Until then, contributors should treat the repository as source code shared by the project team and should not redistribute university data, student information, Google credentials, or generated content without authorization.

## References

[1]: https://docs.nestjs.com/ "NestJS documentation"
[2]: https://supabase.com/docs/guides/auth/jwts "Supabase JWT documentation"
[3]: https://developers.google.com/drive/api/guides/about-sdk "Google Drive API documentation"
[4]: https://zod.dev/ "Zod documentation"
[5]: https://turborepo.com/docs "Turborepo documentation"
