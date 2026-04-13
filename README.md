# InitMyFolio

**Generate a stunning portfolio from your GitHub profile in seconds — no code required.**

Connect your GitHub account and instantly get a portfolio hosted at `username.initmyfolio.com`, complete with your repos, languages, and stats. Automatically kept up to date.

> Inspired by [gitfolio](https://github.com/imfunniee/gitfolio) but modern, hosted, and actually maintained.

---

## How it works

1. Click **"Continue with GitHub"**
2. Authorize read access to your public profile
3. Your portfolio is live at `username.initmyfolio.com`

That's it. Data syncs automatically every 8 hours in the background.

---

## Features

| | |
|---|---|
| **Instant** | Portfolio goes live the moment you sign in |
| **Fast** | Pages are statically generated (Next.js ISR) and served in milliseconds |
| **No rate limits** | GitHub data is cached in PostgreSQL — your portfolio never calls GitHub at runtime |
| **Auto-sync** | Background cron updates all portfolios every 8 hours |
| **SEO ready** | Open Graph, Twitter cards, and JSON-LD structured data on every portfolio |
| **Self-hostable** | One `docker compose up` on any VPS — no vendor lock-in |
| **Open source** | MIT licensed, fully transparent |

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS |
| Backend | Hono · Node.js · TypeScript |
| Database | PostgreSQL · Prisma ORM |
| Auth | GitHub OAuth 2.0 · JWT (jose) |
| Monorepo | Turborepo · npm workspaces |
| Deployment | Docker Compose |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL database ([Neon](https://neon.tech) free tier works great)

### 1. Clone & install

```bash
git clone https://github.com/yourusername/initmyfolio
cd initmyfolio
npm install
```

### 2. Create a GitHub OAuth App

Go to [github.com/settings/applications/new](https://github.com/settings/applications/new):

| Field | Value |
|---|---|
| Homepage URL | `http://localhost:3000` |
| Callback URL | `http://localhost:3001/auth/github/callback` |

Copy the **Client ID** and generate a **Client Secret**.

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
JWT_SECRET=        # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INTERNAL_SYNC_KEY= # same command, different value
DATABASE_URL=      # pooled connection string from Neon
DIRECT_URL=        # direct (non-pooled) connection string from Neon
```

> **Neon users**: use the **Direct connection** string for `DIRECT_URL` (no `-pooler` in the hostname). Both strings are available on your Neon dashboard under Connection Details.

### 4. Set up the database

```bash
npm run db:push --workspace=@initmyfolio/db
```

> If port 5432 is blocked on your network, see [Running behind a firewall](#running-behind-a-firewall).

### 5. Run in development

```bash
npm run dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |

---

## Deployment

### Docker Compose (recommended)

```bash
cp .env.example .env
# Fill in production values

docker compose up -d
```

This starts PostgreSQL, Redis, the API, and the web app. Configure your reverse proxy (nginx, Caddy) to route `*.initmyfolio.com` to the web container on port 3000.

### Environment variables for production

| Variable | Description |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GITHUB_CALLBACK_URL` | Full callback URL (e.g. `https://api.initmyfolio.com/auth/github/callback`) |
| `JWT_SECRET` | Random string ≥ 32 chars |
| `INTERNAL_SYNC_KEY` | Secret key for cron-triggered syncs |
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) |
| `CORS_ORIGIN` | Your frontend URL (e.g. `https://initmyfolio.com`) |
| `NEXT_PUBLIC_API_URL` | Public API URL |
| `NEXT_PUBLIC_APP_URL` | Public web URL |
| `NEXT_PUBLIC_APP_DOMAIN` | Base domain for subdomain routing (e.g. `initmyfolio.com`) |

---

## API reference

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/auth/github` | — | Start GitHub OAuth flow |
| `GET` | `/auth/github/callback` | — | OAuth callback, issues JWT |
| `GET` | `/auth/me` | Bearer | Current user + full GitHub data |
| `GET` | `/api/users/:username` | — | Public portfolio data |
| `PUT` | `/api/users/:username/settings` | Bearer | Update portfolio settings |
| `POST` | `/api/sync/:username` | Bearer | Trigger manual sync (rate limited: 5 min) |

---

## Subdomain routing

In production, `username.initmyfolio.com` is handled entirely by the Next.js middleware (`apps/web/src/middleware.ts`) — no extra infrastructure needed:

```
username.initmyfolio.com  →  middleware detects subdomain  →  rewrites to /[username]  →  portfolio page
```

In development, the portfolio is accessible at `http://localhost:3000/username` directly.

---

## Running behind a firewall

If port 5432 is blocked (e.g. on a school or corporate network), you can apply the schema directly through Neon's SQL editor:

```bash
# Generate the SQL without a database connection
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel packages/db/prisma/schema.prisma \
  --script
```

Paste the output into **Neon dashboard → SQL Editor** and run it.

---

## License

MIT
