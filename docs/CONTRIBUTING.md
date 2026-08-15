# Contributing to IT-SUM

## Contribution principles

IT-SUM is a multi-tenant educational platform. Contributions must preserve tenant isolation, keep student data private, avoid unnecessary provider coupling, and maintain a stable contract between the backend and frontend. Small, reviewable changes are preferred over broad rewrites.

## Before starting

Read the root [`README.md`](../README.md), [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/SECURITY.md`](SECURITY.md), and the relevant domain guide. Confirm whether the change belongs in `apps/api`, `packages/shared`, `packages/drive`, `supabase/migrations`, or the future frontend package.

## Branches and commits

Use a focused branch based on `main`:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feat/resource-search
```

Use concise conventional commit messages such as:

```text
feat: add resource facet filtering
fix: reject cross-tenant stream tokens
docs: expand Drive setup guide
test: cover RLS resource policies
```

Do not commit generated `dist` output, local environment files, provider credentials, browser exports, database dumps, or personal data.

## Contract-first changes

When changing an API payload:

1. Add or update the Zod schema in `packages/shared`.
2. Export the inferred TypeScript type.
3. Update the API controller and service mapping.
4. Update the frontend client or integration boundary.
5. Add request, response, authorization, and tenant-isolation tests.
6. Update [`docs/API.md`](API.md) with the new behavior.

The API should parse response objects through the shared schema before returning them. Do not silently introduce a second DTO definition that can drift from the frontend contract.

## Database changes

Never edit an applied migration. Create the next numbered SQL migration. Every new table should have a primary key, timestamps, foreign keys, indexes for intended access paths, a deletion policy, a tenant key where applicable, and an RLS decision.

A migration pull request must explain data ownership, expected row volume, backfill behavior, transaction safety, and rollback or forward-fix strategy. Test it against a disposable Supabase project or branch before review.

## API changes

Every new protected route requires an explicit role and tenant decision. Add a public decorator only when the route has a separate credential such as a short-lived stream token or a signed OAuth state. Validate query and body inputs with Zod. Use explicit Supabase column lists and tenant filters.

Keep provider logic in `packages/drive` or a future provider adapter. Controllers should coordinate HTTP behavior and delegate business logic to services. Do not place service-role access or Google client initialization in frontend code.

## Security and privacy

Do not log bearer tokens, refresh tokens, stream URLs, private PDF content, full AI prompts, full AI answers, quiz answer keys, or personal data that is not needed for debugging. Review Pino redaction when adding a sensitive field. Follow [`docs/SECURITY.md`](SECURITY.md) for secrets and incident handling.

## Required verification

Run the following before opening a pull request:

```bash
pnpm install --frozen-lockfile
pnpm --filter @it-sum/shared build
pnpm --filter @it-sum/drive build
pnpm typecheck
pnpm build
pnpm test
```

If a live integration cannot be tested locally, document the limitation and provide a staging verification procedure. A green TypeScript build does not prove RLS, OAuth, or tenant isolation behavior.

## Pull request checklist

A pull request should state the problem, the scope, affected packages, database changes, security considerations, verification commands, and any required environment variables. Include screenshots only when UI behavior changed and ensure they do not contain real student or credential data.

Reviewers should confirm that the diff preserves shared contracts, does not weaken tenant checks, does not expose service secrets, does not modify applied migrations, and includes documentation for user-visible or operator-visible behavior.

## References

[1]: https://www.conventionalcommits.org/ "Conventional Commits specification"
[2]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests "GitHub pull request documentation"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
