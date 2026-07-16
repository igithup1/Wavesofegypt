---
name: WavesOfEgypt stack
description: Auth approach, password hashing, API client patterns, and key architectural decisions for the WavesOfEgypt project.
---

# WavesOfEgypt Stack

## Auth
- Token-based Bearer auth (not sessions/cookies)
- Tokens stored in `sessions` DB table, 30-day expiry
- Password = `sha256(password + "wavesofegypt_salt_2025")` via Node `crypto`
- Demo password for all seed users: `password123`
- Seed users: admin@wavesofegypt.com, vendor@redseadiving.com, vendor@nilecruises.com, + 3 customers (vendor ID = 2)

## API Client Hook Patterns
- `useGetFeaturedTours()` → returns `Tour[]` directly (NOT `.tours`)
- `useGetBestSellerTours()` → returns `Tour[]` directly (NOT `.tours`)
- `useListTours(params, options)` → returns `TourList` object — use `.tours`
- Hook options: `{ query: UseQueryOptions, request: ... }` (second arg)
- Drizzle `numeric` fields (price, rating, durationHours) → always wrap in `Number()`
- Drizzle `avg()` also returns string → `Number(result?.avg ?? fallback)` before `.toFixed()`

## Codegen
- Run: `pnpm --filter @workspace/api-spec run codegen`
- Generates: `lib/api-client-react` and `lib/api-zod` from `lib/api-spec/openapi.yaml`

## DB
- Tours IDs start at 11 (seeded after cleanup)
- Destination: only Hurghada (ID=1)
- Categories: 7 Hurghada-specific (IDs 1-7)
- 231 tours seeded across all 7 categories

**Why:** Auth uses sha256+salt instead of bcrypt for simplicity; sessions in DB for easy invalidation.
