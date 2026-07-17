# WavesOfEgypt

Hurghada's curated tour marketplace — 33+ handpicked Red Sea experiences, WhatsApp booking, verified operators, and free cancellation.

A full-stack monorepo containing a REST API, a React web app, and an Expo mobile app.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running in Development](#running-in-development)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [API Regeneration](#api-regeneration)
- [Running Tests](#running-tests)
- [Notes on Local Development (non-Linux)](#notes-on-local-development)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Package manager | pnpm workspaces |
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| API server | Express 5 |
| Database | PostgreSQL 15 + Drizzle ORM |
| Validation | Zod (v4), drizzle-zod |
| API contract | OpenAPI 3.1 → Orval (codegen) |
| Web app | React 19, Vite 7, TailwindCSS v4, Wouter, Framer Motion |
| Mobile app | Expo 54, React Native 0.81, Expo Router |
| Authentication | Token-based Bearer sessions stored in PostgreSQL |
| Email | Nodemailer (SMTP, optional) |

---

## Project Structure

```
wavesofegypt/
├── artifacts/
│   ├── api-server/          # Express 5 REST API
│   │   └── src/
│   │       ├── routes/      # Route handlers (auth, tours, bookings, …)
│   │       ├── lib/         # Auth, email, logger
│   │       └── seeds/       # Database seed scripts
│   │
│   ├── waves-of-egypt/      # React + Vite web app
│   │   └── src/
│   │       ├── pages/       # Route-level page components
│   │       ├── components/  # UI & layout components
│   │       ├── hooks/       # Custom hooks (trip planner, page meta, …)
│   │       └── contexts/    # Auth context
│   │
│   └── waves-of-egypt-mobile/   # Expo React Native mobile app
│       └── app/
│           ├── (tabs)/      # Tab navigator screens
│           └── tour/        # Tour detail screen
│
├── lib/
│   ├── db/                  # PostgreSQL schema (Drizzle), migrations
│   ├── api-spec/            # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/    # Generated React Query hooks (do not edit)
│   └── api-zod/             # Generated Zod validators (do not edit)
│
├── scripts/                 # Utility scripts
├── .env.example             # Environment variable documentation
└── pnpm-workspace.yaml      # Workspace + package catalog configuration
```

---

## Prerequisites

- **Node.js** 24 or later — [nodejs.org](https://nodejs.org)
- **pnpm** 9 or later — `npm install -g pnpm`
- **PostgreSQL** 15 or later (local or hosted)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/wavesofegypt.git
cd wavesofegypt

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL at minimum

# 4. Push the database schema
pnpm --filter @workspace/db run push

# 5. Seed the database with tours, categories, and destinations
node lib/db/seed-hurghada.mjs

# 6. (Optional) Seed sample reviews
pnpm --filter @workspace/api-server tsx src/seeds/reviews.ts
```

---

## Environment Variables

Copy `.env.example` to `.env` and edit the values. Full documentation is in that file. Summary:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `PORT` | No | API server port (default: `8080`) |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |
| `SMTP_HOST` | No | SMTP server — omit to skip emails |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From address (default: `bookings@wavesofegypt.com`) |
| `BASE_PATH` | No | Web app base path (default: `/`) |
| `EXPO_PUBLIC_DOMAIN` | No | API domain for mobile app (default: `localhost:8080`) |

---

## Database Setup

The database schema is defined in `lib/db/src/schema/`.

```bash
# Push schema to your database (creates/alters tables)
pnpm --filter @workspace/db run push

# Seed tours, categories, and destinations (run once)
node lib/db/seed-hurghada.mjs

# Seed sample reviews (optional, run once)
pnpm --filter @workspace/api-server tsx src/seeds/reviews.ts
```

> **Note:** `seed-hurghada.mjs` requires `DATABASE_URL` to be set in your environment.

---

## Running in Development

Start each service in a separate terminal:

```bash
# API server — http://localhost:8080
pnpm --filter @workspace/api-server run dev

# Web app — http://localhost:5173
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/waves-of-egypt run dev

# Mobile app (Expo)
EXPO_PUBLIC_DOMAIN=localhost:8080 pnpm --filter @workspace/waves-of-egypt-mobile run start
```

### Type-checking

```bash
# Check all packages
pnpm run typecheck
```

---

## Building for Production

```bash
# Type-check + build all packages
pnpm run build
```

Individual builds:

```bash
# API server → artifacts/api-server/dist/index.mjs
pnpm --filter @workspace/api-server run build

# Web app → artifacts/waves-of-egypt/dist/public/
pnpm --filter @workspace/waves-of-egypt run build
```

---

## Deployment

### Web App — Vercel / Netlify

The web app is a standard Vite SPA with no server-side rendering.

| Setting | Value |
|---|---|
| Build command | `pnpm --filter @workspace/waves-of-egypt run build` |
| Output directory | `artifacts/waves-of-egypt/dist/public` |
| Environment variable | `BASE_PATH=/` |

Configure your host to serve `index.html` for all routes (SPA fallback).

> The web app makes API calls to a separate API server. Set your production API URL in the API client config (or use a proxy rule on your host to forward `/api/*` to your API server).

### API Server — Railway / Render / Fly.io / VPS

The API server compiles to a single ESM file via esbuild.

```bash
# Build
pnpm --filter @workspace/api-server run build

# Start
node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Required environment variables in production:
- `DATABASE_URL` — your production PostgreSQL URL
- `PORT` — port your host assigns (usually `8080` or `3000`)
- `NODE_ENV=production`
- `SMTP_*` — optional but recommended for booking emails

### Mobile App — Expo EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

Set `EXPO_PUBLIC_DOMAIN` in your EAS build profile to point to your production API server.

---

## API Regeneration

The API client hooks and Zod validators in `lib/api-client-react/` and `lib/api-zod/` are **generated** from `lib/api-spec/openapi.yaml`. Do not edit them by hand.

After modifying the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Running Tests

```bash
# Build the API server first
pnpm --filter @workspace/api-server run build

# Run integration tests (booking authorization / IDOR prevention)
node --test artifacts/api-server/src/tests/booking-auth.test.mjs
```

---

## Notes on Local Development

### macOS / Windows

`pnpm-workspace.yaml` contains `overrides` that exclude non-Linux platform-specific binaries for `esbuild`, `rollup`, and `lightningcss`. These are Replit-specific optimizations for a Linux x64 host.

**If you are developing on macOS or Windows**, remove or comment out the `overrides` section in `pnpm-workspace.yaml` before running `pnpm install`, then restore it before committing.

### Replit

When running on Replit, the following environment variables are injected automatically by the platform:

- `REPL_ID` — activates Replit-specific Vite plugins (dev banner, cartographer)
- `REPLIT_DEV_DOMAIN` — used by the mobile dev script to point Expo at the Replit proxy
- `PORT`, `BASE_PATH` — set per-artifact by the Replit artifact routing system

You do not need to set these manually on Replit.

---

## License

MIT © WavesOfEgypt
