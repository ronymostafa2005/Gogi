# GOGI — Smart Digital Menu & AI Food Assistant

A premium, mobile-first sales demo for **Gogi Restaurant (Asian / Korean fusion · Maadi, Cairo)**,
built with Next.js 16 (App Router), React 19, Tailwind CSS v4 and TypeScript.

The demo shows how a restaurant menu becomes a **guided ordering experience** powered by a branded
in-house assistant — **Gogi AI** — instead of a flat PDF-style list.

## Getting started

```bash
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production preview
npm run lint                 # eslint
```

## What's in the demo (10 screens)

| # | Screen | Highlight |
|---|--------|-----------|
| 1 | **Hero** | Full-bleed food photography, "Taste Korea, the Gogi way", staggered entrance animations |
| 2 | **Menu** | Craving chips + category tabs, dish cards with Popular/Spicy badges, ratings, quick-add |
| 3 | **AI Assistant** | Free-text craving input, suggestion chips, animated "Gogi AI is reading the kitchen…" |
| 4 | **AI Recommendation** | Animated match-score ring + meter, reason badges, AI rationale, Add / Why-this-dish |
| 5 | **Why This Dish** | AI panel with 4 personalised reasons (popularity, flavour, budget fit, taste tags) |
| 6 | **Smart Combo** | Main + starter + drink bundled at 15% off, with visible savings |
| 7 | **Surprise Me** | One-tap roll through the signature menu → dish + combo |
| 8 | **Dish Details** | Bottom sheet on mobile, centred modal on desktop |
| 9 | **Order Summary** | Line items, 12% service, 14% VAT, AI upsell tip, animated confirmation |
| 10 | **Reservation** | Name/phone/date/time/guests with a context-aware AI seating note |

Persistent touchpoints: sticky glass **navbar**, **floating "Ask Gogi AI"** button (pulse glow),
**"Surprise me"** quick action, sliding **cart drawer**, sticky **order bar**, and toast feedback.

## Design system

- **Palette** — ink `#0e0c0a`, coal `#17130f`, cream `#f3ece3`, sand `#c9b8a3`, gold `#d8a24a`,
  ember `#e05a3a`, jade `#6fae8f` (defined in `app/globals.css` via Tailwind v4 `@theme`).
- **Typography** — `Outfit` (UI) + `Noto Serif KR` (display/accents), loaded with `next/font`.
- **Surfaces** — `.glass` (blur + saturate), `.card-lift`, gold gradient buttons, gold gradient text.
- **Motion** — `fadeUp` / `scaleIn` / `floaty` / `pulseGlow` keyframes, staggered `d1–d6` delays,
  and an `IntersectionObserver`-driven `.reveal` for on-scroll entrances.
- Dark warm Asian aesthetic throughout — no neon, no generic SaaS look.

## Project structure

```
app/
  layout.tsx    # fonts + metadata (GOGI title/description), dark body base
  page.tsx      # the whole interactive app (Home + 12 screen components)
  data.ts       # dish catalogue + Gogi AI recommendation engine
  globals.css   # design tokens, glassmorphism, animations
public/dishes/  # 15 food & interior photographs
```

## How "Gogi AI" works

`data.ts` exposes three pure functions — no external API, so the demo is instant and offline-safe:

- `gogiRecommend(query)` — scores every dish against the parsed craving
  (spice / noodles / beef / chicken / light / sharing / `under N EGP` budget), then returns the
  top 3 with `match` percentages, reason chips and a written rationale.
- `surpriseDish()` — random signature dish from the non-drink pool.
- `smartComboFor(dish)` — pairs the dish with a starter + drink and prices the bundle at 85%.

## Verified

- `npm run build` → **Compiled successfully**, TypeScript clean, `/` prerendered as static.
- All 15 `/dishes/*.jpg` assets return **HTTP 200**.
- Rendered HTML contains the brand, hero copy, craving chips, prices in EGP, Maadi location,
  reservation CTA, and correct Unicode glyphs (`★ ✦ 🔥 고 —`) with **no mojibake**.

## Notes

Menu items, prices (EGP), ratings and copy are realistic demo placeholders for Gogi Maadi.
Photography is sourced from Unsplash and stored locally in `public/dishes/` — swap in the
restaurant's own shots before a live pitch.

---

Originally bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
See the [Next.js docs](https://nextjs.org/docs) for framework details.
