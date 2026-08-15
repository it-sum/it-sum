# Security Guide

## Security objectives

IT-SUM handles student identities, university membership, private study activity, Drive credentials, educational documents, quiz attempts, AI conversations, and operational audit records. Security decisions should preserve tenant isolation, minimize credential exposure, reduce durable access tokens, and make administrative actions reviewable.

## Threat model

The primary threats are cross-tenant data access, stolen bearer tokens, leaked Google refresh tokens, public exposure of private PDFs, OAuth callback replay, over-privileged administrator actions, accidental prompt or answer-key logging, database policy regressions, and unsafe ingestion of Drive content.

The platform assumes that the browser and external provider responses are untrusted inputs. It does not assume that a client-supplied university ID, role, file ID, callback parameter, or URL is authoritative.

## Identity and authorization

Supabase Auth signs user access tokens. The API verifies the signature using the configured JWKS endpoint, checks issuer and audience where configured, validates the tenant claims, and attaches an authenticated request context.

Authorization is layered:

| Layer | Control |
|---|---|
| Token authenticity | JWKS signature verification. |
| Identity shape | Zod validation of subject, university ID, role, and optional email. |
| Route access | Public-route metadata and JWT guard. |
| Role access | `student`, `admin`, and `owner` route metadata. |
| Tenant boundary | Mismatch rejection for explicit university identifiers. |
| Service filtering | Supabase queries scoped to the authenticated university. |
| Database isolation | Required RLS policies for all application tables. |
| Object access | Published resource check plus short-lived stream token. |

A role in a client request body must never override the verified role. Role changes require an administrative workflow and an auditable database update.

## Row Level Security

The API guard is not a substitute for RLS. Before production, enable RLS on every public application table and create policies for tenant, user-owned, administrator-owned, and server-only records. Test with at least two universities and all supported roles.

The service-role key bypasses RLS by design. It must remain server-side, must not be sent to the frontend, and should be used only inside narrow service methods. Prefer authenticated-user Supabase clients for user-scoped operations when practical; when the service-role client is necessary for a server workflow, apply explicit tenant filters in code and log a safe audit event.

## Secrets

Store secrets in the deployment platform’s secret manager. The following values are sensitive:

| Secret | Handling rule |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never place in browser configuration. |
| `STREAM_SIGNING_SECRET` | Rotate through a planned token invalidation procedure. |
| `DRIVE_TOKEN_ENCRYPTION_KEY` | Protect like a database encryption key; rotate through re-encryption. |
| `GOOGLE_CLIENT_SECRET` | Server-only; restrict OAuth redirect URIs. |
| Google refresh tokens | Encrypt before database persistence. |
| AI provider keys | Encrypt in `ai_provider_keys`; never log or return them. |

Do not commit `.env`, local credentials, refresh tokens, private keys, database dumps containing personal data, or browser storage exports. The repository `.gitignore` excludes common secret and generated-output paths, but contributors must still inspect staged files.

## PDF access

PDF stream URLs contain a short-lived signed token and must be treated as credentials. Do not include them in analytics events, server logs, referrer headers, screenshots, or persistent browser storage. Set private cache directives. Do not configure a public CDN cache that ignores the token and tenant context.

The stream token binds the resource ID, user ID, and university ID. The stream endpoint must compare the URL resource ID with the signed token resource ID and re-check the resource’s published state before contacting Drive.

## OAuth state protection

The OAuth callback is public because the browser returns from Google without the original bearer header. The signed state must include a purpose, user ID, university ID, issued-at time, and expiration. The callback must reject invalid, expired, or replayed states and must not trust independent identity parameters from the query string.

If replay resistance is required beyond short expiration, store a state nonce hash with a consumed timestamp and reject reuse. This is recommended before production deployment.

## Input and output validation

Use Zod schemas for shared request and response contracts. Validate pagination bounds, UUIDs, search string lengths, enum values, MIME types, and stream token payloads. Reject unexpected data rather than silently broadening accepted inputs.

When adding a route, define the authorization requirement and tenant behavior before implementing the controller. When returning data from Supabase, map columns explicitly and run the result through the response schema.

## Logging and privacy

Pino is configured to redact authorization headers, cookies, prompt content, and answer-key fields. Extend the redaction list when new sensitive fields are introduced.

Logs should contain request method, route, status, latency, correlation ID, tenant ID only where policy permits, and a safe error code. Logs should not contain access tokens, refresh tokens, private PDF URLs, full AI prompts, full AI answers, quiz answer keys, or student-generated private content.

## AI privacy

AI conversations and messages are tenant-scoped. Retrieval must filter document chunks by university before similarity search. Usage events should record provider, model, token counts, cost estimate, latency, cache state, and status without copying private prompt content into operational logs. Provider keys must be encrypted and budgets must be checked before calling an external model.

If a provider supports data-retention controls, configure the minimum retention consistent with the product’s policy. Publish a clear user notice before storing conversations or sending content to an external provider.

## Security review checklist

Before release, confirm:

- JWT issuer, audience, and JWKS settings target the correct Supabase project.
- Every protected route has an explicit role and tenant decision.
- RLS policies are enabled and tested for every application table.
- Service-role credentials are absent from frontend builds and client responses.
- Google OAuth redirect URIs are exact and HTTPS in production.
- Refresh tokens and AI provider keys are encrypted at rest.
- Stream tokens expire quickly and are excluded from logs.
- ETag and cache behavior does not make private PDFs public.
- Database queries use explicit columns and tenant filters.
- Migrations are reviewed and backups are available.
- The incident contact and credential-rotation procedure are known to the maintainers.

## Incident response

If a bearer token or stream token is exposed, revoke the user session or rotate the stream signing secret according to severity. If a Google refresh token is exposed, revoke it in Google Cloud, mark the Drive account revoked, rotate relevant encryption material, and inspect audit records. If a service-role key is exposed, rotate it immediately and review database access logs.

Preserve the minimum necessary evidence, avoid copying private educational content into tickets, record the affected tenant and time window, and notify the project owner using the approved incident channel.

## References

[1]: https://supabase.com/docs/guides/auth/jwts "Supabase JWT documentation"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
[3]: https://developers.google.com/identity/protocols/oauth2 "Google OAuth 2.0 documentation"
[4]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
