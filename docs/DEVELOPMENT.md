# Development Guide

## Prerequisites

Use Node.js 22 or a compatible current LTS release, pnpm 9.15.5 or newer, Git, and access to the repository. A Supabase project is needed for database and authenticated data workflows. Google OAuth credentials are needed for Drive workflows. Local compilation does not require live provider credentials.

## Install the workspace

```bash
git clone https://github.com/it-sum/it-sum.git
cd it-sum
pnpm install
```

The workspace contains the API and two packages:

```bash
pnpm list --depth -1
```

The root scripts are:

| Command | Purpose |
|---|---|
| `pnpm build` | Builds all packages in Turborepo dependency order. |
| `pnpm dev` | Starts package development scripts that support watch mode. |
| `pnpm typecheck` | Runs strict TypeScript checks across all workspaces. |
| `pnpm lint` | Runs the current TypeScript-based lint command. |
| `pnpm test` | Runs package test scripts. |
| `pnpm format` | Checks Markdown, JSON, and TypeScript formatting through Prettier. |

## Local environment

Create a local `.env` file for `apps/api`. Do not commit it. A safe development configuration can start without Supabase and Google secrets, but any data, OAuth, or Drive operation that requires a provider will return a service-unavailable response until the relevant secret exists.

```dotenv
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1
SERVICE_VERSION=0.1.0

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_ISSUER=https://your-project.supabase.co/auth/v1
SUPABASE_SERVICE_ROLE_KEY=

STREAM_SIGNING_SECRET=replace-with-at-least-32-random-characters
STREAM_TOKEN_TTL_SECONDS=300
DRIVE_TOKEN_ENCRYPTION_KEY=replace-with-at-least-32-random-characters

DRIVE_MODE=oauth_user
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/drive/oauth/callback
GOOGLE_SHARED_DRIVE_ID=
DRIVE_ROOT_FOLDER_ID=
```

Generate strong local secrets with a password manager or a cryptographically secure random generator. Never reuse a production secret in a developer environment.

## Start the API

```bash
pnpm --filter @it-sum/api start:dev
```

The development server uses `tsx watch` and listens on port `3001` by default. Verify liveness:

```bash
curl http://localhost:3001/api/v1/health
```

Expected shape:

```json
{
  "status": "ok",
  "service": "it-sum-api",
  "version": "0.1.0",
  "timestamp": "2026-08-15T00:00:00.000Z"
}
```

The OpenAPI UI is available at `http://localhost:3001/api/v1/docs`.

## Build order

The API imports declarations from the shared and Drive packages. A reliable clean build is:

```bash
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm --filter @it-sum/api build
```

The root `pnpm build` command performs the equivalent dependency-aware build through Turborepo. When diagnosing a declaration-resolution issue, remove generated output and repeat the package build sequence:

```bash
rm -rf packages/shared/dist packages/drive/dist apps/api/dist
pnpm build
```

## Database workflow

Migrations are stored in `supabase/migrations`. Apply them through the Supabase CLI or the project’s approved migration workflow. Do not edit an applied migration in place. Create a new numbered migration instead.

Before applying migrations to shared staging:

1. Confirm the target Supabase project and branch.
2. Review extension availability and database ownership.
3. Apply migrations to a disposable database or preview branch.
4. Add and test the RLS policy migration.
5. Run tenant-isolation queries with representative roles.
6. Record the migration version and verification result.

## Working with shared contracts

The shared package is intentionally small and dependency-light. Add schemas to `packages/shared/src/index.ts` or split them into domain files when the package grows. Export both the schema and its inferred type. The API should call `Schema.parse(...)` at response boundaries and use `ZodValidationPipe` for request validation.

When a schema changes, run:

```bash
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
```

## Debugging authentication

A valid request requires a Supabase access token, not a service-role key. Inspect only non-sensitive claims in a controlled local environment. Do not paste bearer tokens into tickets, shell history, chat, or logs.

If authentication fails, check the following in order:

| Check | Question |
|---|---|
| Header | Is the request using `Authorization: Bearer <access-token>`? |
| JWKS | Does `SUPABASE_JWKS_URL` return the project’s current signing keys? |
| Audience | Does the token use the `authenticated` audience expected by the verifier? |
| Issuer | If configured, does `SUPABASE_ISSUER` match the token issuer? |
| Claims | Are `sub`, `university_id`, and `role` valid and present? |
| Status | Is the user profile approved and active in the database? |
| Tenant | Does every explicit university ID match the token claim? |

## Debugging Drive

Drive workflows require the Google OAuth client, a callback URL registered in Google Cloud, and a configured encryption key. The OAuth start endpoint is restricted to administrators and owners. The callback is public by design because Google redirects the browser without the original bearer header; its signed state protects the user and tenant binding.

If a Drive request fails, confirm the mode, client credentials, redirect URI, Shared Drive ID when applicable, encrypted refresh-token record, and Drive API scopes. Never solve a permissions error by committing a broader credential or by bypassing the API.

## Coding conventions

Use strict TypeScript, ESM-compatible `.js` import specifiers, NestJS dependency injection, small feature modules, and explicit return types at service boundaries. Keep provider-specific logic in adapters. Keep tenant checks visible in services and controllers. Prefer names that distinguish external IDs from internal UUIDs, such as `driveFileId` and `resourceId`.

Do not log access tokens, cookies, refresh tokens, answer keys, full AI prompts, or private student content. Use structured errors and preserve correlation IDs when the error contract supports them.

## Local verification checklist

```bash
pnpm install
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
pnpm test
```

Before a pull request, also inspect the migration diff, confirm no `.env` or generated `dist` files are staged, and confirm that frontend packages still compile if `apps/web` is present.

## References

[1]: https://pnpm.io/workspaces "pnpm workspaces documentation"
[2]: https://turborepo.com/docs/crafting-your-repository/structuring-a-repository "Turborepo repository structure documentation"
[3]: https://docs.nestjs.com/techniques/configuration "NestJS configuration documentation"
[4]: https://supabase.com/docs/guides/cli/local-development "Supabase local development documentation"


## Local development login

The local Supabase seed includes one development-only student account for testing the login flow after `supabase db reset`:

| Field | Value |
|---|---|
| Email | `dev.student@students.ctu.edu.eg` |
| Password | `ITSumDev2026!` |
| Tenant | IT-SUM University |
| Role | Student |
| Status | Active |

Use these credentials only against a local or disposable development database. Do not reuse the password in staging or production, and do not place it in a production `.env` file. The seed is located at [`supabase/seed/004_dev_login.sql`](../supabase/seed/004_dev_login.sql).

After resetting a local Supabase instance, start the API and web app, open `/en/login` or `/ar/login`, and sign in with the account above. If the project uses a hosted Supabase instance, apply the seed only to a disposable development project; never run it against the production project.
