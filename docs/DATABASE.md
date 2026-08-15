# Database and Supabase Guide

## Database responsibilities

Supabase is the system of record for identity-linked application data. It stores tenant structure, profiles, resource metadata, Drive synchronization state, classifications, progress, quizzes, rewards, notifications, audit events, document chunks, embeddings, AI conversations, usage, budgets, provider keys, cache records, and feedback.

Google Drive remains the source of original PDF bytes. The application database stores a Drive file ID, checksum, metadata, publication state, and normalized classifications so the API can authorize and serve a resource without exposing Drive directly to the browser.

## Migration order

Run migrations in filename order:

| Migration | Main contents |
|---|---|
| `0001_extensions.sql` | `vector`, `pg_trgm`, `unaccent`, `pg_cron`, `pg_net`, and the `private` schema. |
| `0002_tenancy_identity_structure_library.sql` | Tenant roots, identities, academic structure, searchable library, folders, resources, bookmarks, and collections. |
| `0003_operational_ai.sql` | Drive state, sync records, videos, quizzes, progress, rewards, notifications, governance, audit, documents, and AI tables. |

The current migration set is a schema foundation. The next migration should add helper functions and explicit RLS policies after the team confirms the exact JWT custom-claim shape used by the Supabase project.

## Tenant and identity tables

| Table | Purpose | Primary tenant key |
|---|---|---|
| `universities` | Tenant root and university settings. | `id` |
| `profiles` | User identity, role, approval status, and university membership. | `university_id` |
| `user_preferences` | Locale, theme, reminders, and AI preference. | Through `user_id` |
| `invitations` | Admin-issued invitation records with hashed tokens. | `university_id` |
| `approval_requests` | User approval workflow. | `university_id` |

The `profiles.id` references `auth.users(id)`. The API should not accept a client-supplied role as authoritative; role comes from the verified identity and should be kept synchronized with the profile record through a controlled administrative workflow.

## Academic structure tables

Departments contain batches. Batches contain semesters. Semesters contain courses. Courses have Arabic and English names, optional codes, normalized slugs, and a generated simple-search vector. Course aliases support alternative spellings and file naming conventions.

Supporting facet tables include `material_kinds`, `exam_phases`, and `contributors`. Folders preserve the Drive-like hierarchy. Resources reference a Drive file, title, MIME type, size, checksum, modified time, publication status, visibility, download policy, course, contributor, material kind, and exam phase.

## Library tables

| Table | Purpose |
|---|---|
| `folders` | Drive-like folder hierarchy with parent, path, and depth. |
| `resources` | Published and unpublished PDF metadata. |
| `resource_facets` | Denormalized filter facets for resource browsing. |
| `resource_tags` | Normalized tags for search and classification. |
| `bookmarks` | User-resource saved items. |
| `collections` | User-created resource groups. |
| `collection_resources` | Collection membership. |

Search indexes include generated `tsvector` columns and trigram indexes. The API currently uses an `ilike` title filter; a future search service can combine full-text search, trigram matching, facets, and vector similarity without changing the resource contract.

## Drive and ingestion tables

| Table | Purpose |
|---|---|
| `drive_accounts` | Encrypted refresh-token record and Drive mode per university. |
| `drive_sync_state` | Current Drive changes page token per university. |
| `drive_sync_runs` | Durable sync-run status and counts. |
| `drive_file_versions` | Historical file checksums and current-version marker. |
| `drive_conflicts` | Human-reviewable reconciliation conflicts. |
| `document_chunks` | Extracted text chunks, search vectors, embeddings, and quality score. |

A future ingestion worker should use `drive_file_id` and `drive_md5` as idempotency keys. It should mark removed files unavailable rather than deleting resource history immediately, preserve audit data, and record conflicts when a file’s classification or tenant mapping cannot be resolved safely.

## Learning, progress, and rewards tables

Videos and video sources support YouTube metadata. Quizzes are versioned so published attempts remain tied to the exact question set. Questions and options are ordered. Attempts store an opaque token hash, status, score, and submission state. Progress tables track resource, course, roadmap-node, and streak state.

Rewards are represented by configurable rules, an idempotent points ledger, badges, user badges, and leaderboard snapshots. The ledger’s `(university_id, idempotency_key)` uniqueness constraint prevents duplicate points when a worker retries.

## Notifications and governance tables

Notifications are user-scoped and tenant-scoped. Preferences control reminders, announcements, email behavior, and daily caps. Email delivery records contain deduplication keys and provider message IDs. Announcements, unsubscribe tokens, contact messages, content reports, and audit logs support operational governance.

Do not store raw unsubscribe tokens or provider credentials. Store hashes or encrypted values as appropriate. Audit records should avoid full private content and should use correlation IDs to connect actions across API and workers.

## AI tables

`ai_conversations` and `ai_messages` store study interactions. `ai_usage_events` records provider, model, token counts, estimated cost, latency, cache hits, fallbacks, and status. `ai_budgets` defines caps. `ai_provider_keys` stores encrypted provider keys. `ai_cache` stores expiring responses. `ai_feedback` records user ratings.

AI features must remain tenant-aware. Retrieval should filter document chunks by `university_id` before similarity search. Usage must be recorded even when a provider fails over to another model. Prompts and answers must not be logged in plaintext by the API logger.

## Row Level Security plan

RLS is a required production control and is not complete merely because the tables contain `university_id`. The next migration should:

1. Enable RLS on every public application table.
2. Add helper functions that derive `auth.uid()`, tenant ID, and role from trusted JWT claims or the `profiles` table.
3. Add tenant-scoped `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies according to the ownership model.
4. Restrict students to their own progress, bookmarks, collections, attempts, notifications, and AI records.
5. Permit students to read only published resources visible to their tenant.
6. Permit admins and owners to manage approved academic and content records for their tenant.
7. Restrict audit, provider-key, Drive-token, and budget tables to owners or controlled server-side workflows.
8. Test cross-tenant reads and writes with two universities and all supported roles.
9. Confirm service-role operations are deliberate and never exposed to the browser.
10. Add regression tests that fail if a policy is removed or broadened accidentally.

The API’s `TenantGuard` and service-layer filters are defense in depth. They do not replace RLS.

## Migration review checklist

Before merging a migration, confirm that every new table has a primary key, timestamps, appropriate foreign keys, a tenant key where relevant, indexes for common filters, a clear deletion policy, and an RLS decision. Verify that enum additions are backward-compatible and that generated columns use supported immutable expressions.

Before production application, take a database backup, apply to staging, run policy tests, check query plans for resource listing and document retrieval, and record the migration version in the release notes.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
[2]: https://supabase.com/docs/guides/database/postgres/overview "Supabase Postgres documentation"
[3]: https://supabase.com/docs/guides/database/extensions "Supabase database extensions documentation"
[4]: https://github.com/pgvector/pgvector "pgvector documentation"
