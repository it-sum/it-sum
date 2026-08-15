# Prompt for the Other IT-SUM Agent

Copy the following prompt into the other agent session:

```text
You are the frontend/integration agent for IT-SUM. I am the backend/integration agent working in the same GitHub repository: https://github.com/it-sum/it-sum.

I reviewed your linked Manus task. Your last visible report said you completed a shared contract package with 36 passing tests, route registry, Arabic normalization utilities, mock fixtures, and answer-key stripping, then later reported a multi-university Supabase schema with RLS, seeded IT-SUM structure, NestJS Supabase/JWKS auth, register/login/refresh/me, academic structure reads, four API tests, 36 shared tests, lint, typecheck, and Next.js/NestJS builds passing at commit `b1bb345`. That commit is not visible on the current GitHub `main`; the visible history is `0a1da64`, `c1ceb21`, `e1b36ca`, and the new backend API commit from this session. Please do not overwrite `main`; pull first and reconcile your local work carefully.

Current backend state on `main`:
- pnpm/Turborepo monorepo with `apps/api`, `packages/shared`, and `packages/drive`.
- NestJS 11 API with Supabase JWKS verification, role guard, tenant guard, Zod contracts, pino redaction, health, resources, signed PDF stream tokens, Range/ETag stream proxy, Drive OAuth, encrypted refresh-token storage, and Drive delta sync.
- Supabase migrations for extensions, tenancy, identity, academic structure, library, Drive sync, videos, quizzes, progress, rewards, notifications, support, audit, and AI tables.
- Full schema-backed API surface now added for users/preferences, academics, videos, quizzes/attempts, progress, rewards/leaderboard, notifications, support contact/reports, and AI conversations/messages/feedback.
- Documentation is in `README.md`, `BACKEND_HANDOFF.md`, and `docs/`.

Credentials and security:
- Supabase URL is `https://ztujhryukdddhjymhfod.supabase.co`.
- The user supplied a Supabase publishable key and a Google OAuth client JSON, but secrets must not be committed. `.env.example` contains only safe placeholders and non-secret client metadata.
- Google OAuth client ID is `39929218812-3jfqrs4mnau4co2j7usecauvdim62orq.apps.googleusercontent.com`; the client currently has no redirect URIs or JavaScript origins configured. Add the exact local and production callback URIs in Google Cloud before testing OAuth.
- The backend still needs the Supabase service-role key, Google client secret, stream signing secret, and Drive token encryption key in local `.env` or deployment secrets.

Your next tasks:
1. Pull `main` and run `pnpm install`, `pnpm typecheck`, and `pnpm build`.
2. If you have unpushed work from commit `b1bb345`, push it to a separate branch and open a pull request instead of force-pushing.
3. Build the frontend against `@it-sum/shared`; do not duplicate DTOs.
4. Use the API routes documented in `docs/API.md` and the backend handoff.
5. Keep quiz answer keys out of the frontend. Student-facing quiz responses intentionally omit `isCorrect`.
6. Use the stream-token flow for PDFs: list resources, request `/resources/:id/stream-token`, then open the returned absolute URL.
7. Test tenant isolation with at least two universities before staging.
8. Report back with your current commit, test output, and any contract mismatch before changing shared schemas.

Priority: finish frontend integration against the implemented API, then help add integration tests for auth, tenant isolation, quiz submission, progress, and PDF streaming.
```

## Communication status

The Manus share link is read-only from this session, so the prompt could not be sent directly through that link. This file is committed in the repository as the coordination handoff for the other agent.
