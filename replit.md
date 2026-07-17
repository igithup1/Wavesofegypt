# WavesOfEgypt

Hurghada's curated tour marketplace — Red Sea experiences, WhatsApp booking, verified local operators.

## Run & Operate

```bash
# API server (port set by Replit via $PORT)
pnpm --filter @workspace/api-server run dev

# Web app
pnpm --filter @workspace/waves-of-egypt run dev

# Mobile app (Expo)
pnpm --filter @workspace/waves-of-egypt-mobile run dev

# Full typecheck
pnpm run typecheck

# Full build (typecheck + all packages)
pnpm run build

# Regenerate API client hooks + Zod validators from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes to the database (dev only — never run in production)
pnpm --filter @workspace/db run push
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — provisioned via the Replit PostgreSQL integration |
| `SMTP_HOST` | SMTP server for booking confirmation emails (optional — emails are skipped if unset) |
| `SMTP_PORT` | SMTP port (optional, default: 587) |
| `SMTP_USER` | SMTP username (optional) |
| `SMTP_PASS` | SMTP password — store as a Replit secret (optional) |
| `SMTP_FROM` | From address for emails (optional, default: bookings@wavesofegypt.com) |

Replit auto-injects `PORT`, `BASE_PATH`, `REPL_ID`, `REPLIT_DEV_DOMAIN`, and `REPLIT_EXPO_DEV_DOMAIN`.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **API**: Express 5, PostgreSQL, Drizzle ORM, Zod v4
- **API contract**: OpenAPI 3.1 → Orval codegen → `lib/api-client-react`, `lib/api-zod`
- **Web**: React 19, Vite 7, TailwindCSS v4, Wouter (routing), Framer Motion
- **Mobile**: Expo 54, React Native 0.81, Expo Router
- **Auth**: Bearer token, sessions stored in `sessions` table (SHA-256 + fixed salt — not bcrypt)
- **Email**: Nodemailer (SMTP, optional — missing SMTP vars → warning + skip)
- **Build**: esbuild (API server → single ESM bundle)

## Where Things Live

| What | Where |
|---|---|
| DB schema (source of truth) | `lib/db/src/schema/` |
| OpenAPI spec (source of truth) | `lib/api-spec/openapi.yaml` |
| Generated API hooks | `lib/api-client-react/` — **do not edit** |
| Generated Zod validators | `lib/api-zod/` — **do not edit** |
| Theme / design tokens | `artifacts/waves-of-egypt/src/index.css` |
| Route handlers | `artifacts/api-server/src/routes/` |
| Page components | `artifacts/waves-of-egypt/src/pages/` |
| Mobile screens | `artifacts/waves-of-egypt-mobile/app/` |
| Seed scripts | `lib/db/seed-hurghada.mjs`, `artifacts/api-server/src/seeds/` |

## Architecture Decisions

- **Token-in-header auth** (not cookies/sessions): avoids CORS complexity across sub-domains; token stored in `localStorage` on web, in-memory on mobile. Sessions have a 30-day TTL, stored in `sessions` table.
- **OpenAPI → codegen** workflow: all API client code in `lib/api-client-react/` and `lib/api-zod/` is generated — run `pnpm --filter @workspace/api-spec run codegen` after any spec change.
- **WhatsApp as primary booking channel**: no payment gateway. Users select a tour and are routed to WhatsApp with a pre-filled message. Checkout form captures intent data for the operator.
- **React.lazy + Suspense** on all routes except Home: splits every page into its own JS chunk — significantly reduces initial bundle load time.
- **Replit-specific Vite plugins** (`cartographer`, `dev-banner`, `runtime-error-modal`) are gated behind `REPL_ID !== undefined` and load only when running on Replit — the build produces a clean bundle for any other host.

## Product

- **Homepage**: hero, category browser, best sellers grid (12 tours), reviews, FAQ, WhatsApp CTA.
- **Tour listing**: filterable by category, search, price. Each card has a heart for the My Trip planner.
- **Tour detail**: gallery slider, itinerary, inclusions/exclusions, real reviews, WhatsApp booking button.
- **My Trip planner**: localStorage-based wishlist with per-tour date/guest pickers and a WhatsApp message builder.
- **Booking flow**: checkout form → confirmation page → booking confirmation email (if SMTP configured).
- **Admin dashboard**: manage all bookings (view, filter by status, update status).
- **Mobile app**: home, category browse, tour detail — all backed by the same API server.

## Gotchas

- **`pnpm --filter @workspace/db run push`** is for development only. In production, use Drizzle migrations.
- The **esbuild `overrides`** in `pnpm-workspace.yaml` exclude non-Linux binaries. If developing on macOS or Windows, comment those out before running `pnpm install`.
- **Mobile fonts on web**: `@expo-google-fonts` uses `fontfaceobserver` on web, which has its own 6 000 ms timeout that throws outside React's tree. The `_layout.tsx` skips font loading entirely on `Platform.OS === 'web'` to avoid this crash.
- **API server must be built before running integration tests**: `pnpm --filter @workspace/api-server run build` first, then `node --test artifacts/api-server/src/tests/booking-auth.test.mjs`.
- The `lib/api-client-react/` and `lib/api-zod/` directories are **generated** — never edit them. Run codegen after any OpenAPI spec change.

## User Preferences

- No unnecessary new features — stability and polish over feature velocity.
- Booking is WhatsApp-first; no payment gateway currently.
- Keep the premium visual tone: serif headings (Playfair Display), teal/navy palette, generous whitespace.
