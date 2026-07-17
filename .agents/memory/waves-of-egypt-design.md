---
name: WavesOfEgypt Design System
description: Premium design decisions made during polish passes — homepage flow, My Trip feature, typography, section patterns, shadow system, and copy rules.
---

# WavesOfEgypt Design Decisions

## Homepage section order (final)
Hero → Categories → Best Sellers (12-tour grid) → Why Book With Us → Customer Reviews → FAQ → Final CTA
Removed: Popular Destinations, Great Value Tours (Affordable Adventures), Gallery sections

## My Trip feature (localStorage, no login required)
- Hook: `src/hooks/useTripPlanner.ts` — cross-component pub-sub via `listeners` Set
- Storage key: `woe_my_trip` in localStorage
- Stores: `{ items: TripItem[], hotel: string, requests: string }`
- `TripItem`: `{ tour: Tour, date: string, adults: number, children: number }`
- Page: `/my-trip` — empty state + filled state with per-tour preferences + WhatsApp message builder
- Heart icon on ALL TourCard instances (both grid and horizontal variants)
- Heart icon on tour detail page wired to `toggleTour(tour)` + `isSaved(tour.id)`
- Navbar: always-visible "My Trip" link with red badge when count > 0
- **Why:** no login requirement = no friction; localStorage = instant; WhatsApp stays the booking channel
- **How to apply:** any new component showing tours should import `useTripPlanner` and add a heart button

## Hero copy
- Headline: "Where Ancient Egypt / Meets the Red Sea" — two lines, accent color on line 2
- Subtitle: "Island escapes, coral reef dives, Sahara safaris, and temple odysseys — all from Hurghada, Egypt's adventure capital."
- Gradient: `from-black/65 via-black/15 to-black/75` + radial vignette
- Stats strip: `bg-gradient-to-r from-black/60 via-black/55 to-black/60 backdrop-blur-md`
- Animated scroll indicator on desktop (Framer Motion `y: [0,8,0]`)

## SectionHeader pattern
- Labels use double accent lines: `<span class="w-8 h-px bg-accent" /> LABEL <span class="w-8 h-px bg-accent" />`
- Centered variant used for reviews, FAQ — pass `centered` prop
- Title size: `text-3xl md:text-4xl lg:text-5xl`

## Card hover pattern
- All image cards: `whileHover={{ y: -5 }}` + `group-hover:scale-[1.06]` (not scale-108 — invalid class)
- Tour cards: `whileHover={{ y: -5 }}` + `whileTap={{ scale: 0.98 }}`

## Why Book With Us section
- No double-icon system — just one colored icon in a circle container per card
- Icons have distinct colors: yellow, green, blue, purple, cyan, orange
- Cards: `bg-white/5 hover:bg-white/9 border border-white/10`

## Reviews section
- Opening quotemark: `text-5xl font-serif text-accent/25`
- Review text: `text-foreground` (NOT text-muted-foreground)
- Verified badge: green pill with checkmark icon

## FAQ accordion
- Smooth animation via `max-h-0 → max-h-64` CSS transition (not conditional render)
- Active state: filled circle button `bg-primary text-primary-foreground`
- Active border: `border-primary/30 bg-primary/5`

## Shadow system (index.css)
- shadow-sm: `0 1px 3px 0 rgb(0 0 0 / 0.08)`
- shadow: `0 4px 8px -2px rgb(0 0 0 / 0.10)`
- shadow-md: `0 10px 20px -4px rgb(0 0 0 / 0.12)`
- shadow-lg: `0 20px 35px -8px rgb(0 0 0 / 0.15)`

## Gallery copy rule
- Do NOT claim "no stock images" — images are from Unsplash
- Gallery section has been removed from homepage

## Final CTA
- Real background image + `bg-primary/88` overlay
- Headline: "Your Dream Holiday Starts With One Message."
- Micro-copy trust strip: Shield icon + cancellation/reply time text
