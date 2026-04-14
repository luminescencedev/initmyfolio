# InitMyFolio

**Generate a portfolio from your GitHub profile in seconds — no code required.**

Connect your GitHub account and instantly get a public portfolio page with your repos, languages, and stats. Kept up to date automatically.

---

## How it works

1. Click **"Connect with GitHub"**
2. Authorize read-only access to your public profile
3. Your portfolio is live in seconds

Data syncs automatically every 8 hours in the background.

---

## Features

|                   |                                                             |
| ----------------- | ----------------------------------------------------------- |
| **Instant**       | Portfolio goes live the moment you sign in                  |
| **Fast**          | Pages are statically generated (Next.js ISR)                |
| **Auto-sync**     | Background cron keeps your portfolio up to date             |
| **SEO ready**     | Open Graph, Twitter cards, and JSON-LD on every portfolio   |
| **Customizable**  | Accent colors, layout variants, section order, pinned repos |
| **Self-hostable** | MIT licensed — run it on your own infrastructure            |

---

## Tech stack

| Layer    | Tech                                                   |
| -------- | ------------------------------------------------------ |
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 |
| Backend  | Hono · Node.js · TypeScript                            |
| Database | PostgreSQL · Prisma ORM                                |
| Auth     | GitHub OAuth 2.0 · JWT                                 |
| Monorepo | Turborepo · npm workspaces                             |

---

## Getting started (local development)

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) free tier works great)

### 1. Clone & install

```bash
git clone https://github.com/luminescencedev/initmyfolio
cd initmyfolio
npm install
```

### 2. Create a GitHub OAuth App

Go to [github.com/settings/applications/new](https://github.com/settings/applications/new):

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Homepage URL | `http://localhost:3000`                      |
| Callback URL | `http://localhost:3001/auth/github/callback` |

### 3. Configure environment

```bash
cp .env.example .env
# fill in your GitHub OAuth credentials and database URLs
```

### 4. Set up the database

```bash
npm run db:push --workspace=@initmyfolio/db
```

### 5. Run

```bash
npm run dev
```

| Service | URL                   |
| ------- | --------------------- |
| Web     | http://localhost:3000 |
| API     | http://localhost:3001 |

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full guide using **Vercel + Render + Neon** (all free tier).

For self-hosted VPS deployment, see [DEPLOY_VPS.md](./DEPLOY_VPS.md).

---

## License

[MIT](./LICENSE)
