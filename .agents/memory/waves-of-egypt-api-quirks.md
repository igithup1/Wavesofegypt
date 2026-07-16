---
name: WavesOfEgypt API response shapes
description: Which hooks return arrays vs objects with .tours property
---

## Hooks that return Tour[] directly (arrays)
- `useGetFeaturedTours` → `Tour[]`
- `useGetBestSellerTours` → `Tour[]`
- `useGetSpecialOffers` → `Tour[]`

## Hooks that return TourList object (use `.tours`)
- `useListTours` → `{ tours: Tour[], total, limit, offset }`

**Why this matters:** Calling `.tours.map()` on an array-returning hook crashes at runtime.
**Pattern:** Use `data?.map(...)` for array hooks, `data?.tours.map(...)` for useListTours.
