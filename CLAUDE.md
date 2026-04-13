# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the **monorepo root** unless specified otherwise.

```bash
# Install all dependencies (npm workspaces — one install covers everything)
npm install

# Run both apps in dev mode (Turborepo runs api + web in parallel)
npm run dev

# Type-check all packages
npm run type-check

# Format all files
npm run format

# Run API tests
npm test --workspace=@initmyfolio/api

# Run a single test file
npx vitest run apps/api/src/tests/users.test.ts

# Database (all scripts load ../../.env via dotenv-cli automatically)
npm run db:push --workspace=@initmyfolio/db      # apply schema to DB (dev)
npm run db:migrate --workspace=@initmyfolio/db   # create a migration file
npm run db:generate --workspace=@initmyfolio/db  # regenerate Prisma client after schema change
npm run db:studio --workspace=@initmyfolio/db    # open Prisma Studio

# Build for production
npm run build
```

Ports in dev: **API → 3001**, **Web → 3000**.

## Environment variables

The `.env` lives at the **monorepo root**. Subpackages load it explicitly:
- `apps/api` dev script prefixes `dotenv -e ../../.env --`
- `packages/db` scripts all prefix `dotenv -e ../../.env --`

This means running scripts from inside a subdirectory without `dotenv-cli` will fail to find `DATABASE_URL`. Always use the workspace commands from root.

The database requires **two URLs** for Neon (or any serverless PostgreSQL):
- `DATABASE_URL` — pooled connection (used at runtime by Prisma)
- `DIRECT_URL` — direct connection without pooler (used by `db:push` / `db:migrate`)

This is set in `packages/db/prisma/schema.prisma` via `directUrl = env("DIRECT_URL")`.

## Architecture

### Monorepo layout

```
apps/api/        Hono HTTP server (Node.js, ESM, "type": "module")
apps/web/        Next.js 15 App Router
packages/db/     Prisma schema + singleton PrismaClient ("type": "module")
packages/ui/     Shared React components (Button, Badge, Card)
packages/config/ Shared tsconfig base (NodeNext, strict, types: ["node"])
```

### Data flow — the sync/read split

GitHub data is **never fetched at request time for public portfolio pages**. The flow is:

1. **Write path** (`/auth/github/callback`, `POST /api/sync/:username`) — calls GitHub API, stores raw data in `User.githubData` (JSONB column).
2. **Read path** (`GET /api/users/:username`) — reads straight from PostgreSQL, zero GitHub API calls. This is what the portfolio page hits.
3. **Cron** (`apps/api/src/cron/index.ts`) — runs every 8 hours on startup, batches 10 users with 5s delays between batches, re-syncs users whose `lastSyncedAt` is stale.

### API (`apps/api`)

- **Framework**: Hono with `@hono/node-server`. All internal imports use `.js` extension (required by NodeNext ESM).
- **Auth**: JWT via `jose` (HS256, 30-day expiry). Token issued at end of OAuth flow, stored in `localStorage` on client, sent as `Authorization: Bearer <token>`.
- **Context typing**: All authenticated routes type the router as `Hono<{ Variables: AppVariables }>` (defined in `src/types.ts`). The `authMiddleware` calls `c.set("userId", ...)` and `c.set("username", ...)`.
- **Prisma JSON fields**: `User.githubData` and `User.settings` are `Json` columns. Always pass `JSON.parse(JSON.stringify(data))` to Prisma — never cast as `Record<string, unknown>` (breaks under `exactOptionalPropertyTypes`).
- **Manual sync rate limit**: 5 minutes per user. Returns `{ retryAfter, availableAt }` on 429.
- **Public API rate limit**: 60 req/min per IP, in-memory Map in `src/middleware/rateLimit.ts`.

Routes:
```
GET  /auth/github                  → redirect to GitHub OAuth
GET  /auth/github/callback         → exchange code, upsert user, issue JWT, redirect to /dashboard?token=
GET  /auth/me                      → verify Bearer, return full user including githubData
GET  /api/users/:username          → public portfolio read (no GitHub call, rate limited)
PUT  /api/users/:username/settings → update settings (auth, own user only)
POST /api/sync/:username           → trigger sync (Bearer auth or x-internal-key header for cron)
```

### Web (`apps/web`)

- **Subdomain routing**: `src/middleware.ts` detects `username.initmyfolio.com` and rewrites internally to `/[username]`. In dev, responds to `username.localhost:3000`.
- **Portfolio page** (`app/[username]/page.tsx`): Server component, `export const revalidate = 3600` (ISR hourly). Fetches from API with `next: { revalidate: 3600 }`. Includes JSON-LD.
- **Dashboard** (`app/dashboard/page.tsx`): Client component. After OAuth, reads `?token=` from URL, persists to `localStorage`, calls `/auth/me`. Sync button disabled for 5 min after last sync based on `lastSyncedAt`.
- **`src/lib/api.ts`**: All backend calls go here. `triggerSync` returns `{ ok, rateLimited, retryAfter, availableAt }`.
- **Tailwind**: CSS variables for all colors in `globals.css`. Dark mode via `.dark` class on `<html>`.

### Database (`packages/db`)

- Two models: `User` (GitHub data + settings as JSONB) and `Session` (defined in schema but unused — auth is stateless JWT).
- After any schema change: `db:generate` first, then `db:push` (dev) or `db:migrate` (prod).
- Port 5432 must be reachable for `db:push` / `db:migrate`. If blocked by network, generate SQL with `npx prisma migrate diff --from-empty --to-schema-datamodel packages/db/prisma/schema.prisma --script` and run it in the Neon SQL editor.

### tsconfig

- `apps/api`: extends `packages/config/typescript/index.json` → NodeNext, strict, `exactOptionalPropertyTypes`, `types: ["node"]`.
- `apps/web` and `packages/ui`: **standalone configs** (do not extend shared config) — required because the shared config's `extends` resolution breaks JSX in these contexts.
- `packages/config/typescript/index.json` has `"types": ["node"]` which propagates to `apps/api` and `packages/db` that extend it.

### Docker

`docker-compose.yml` at root: `postgres`, `redis`, `api`, `web`. Both apps have multi-stage Dockerfiles. `NEXT_PUBLIC_*` vars must be passed as `--build-arg` at Docker build time for the web image.
