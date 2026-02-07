# Architecture

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + CSS variables (tokens in `tokens/`)
- **Framer Motion** for UI animation
- **Lenis** for smooth scroll on cinematic routes (to be wired in layout/client)
- **React Three Fiber + drei** for 3D (placeholder in `components/universe/`)
- **shadcn/ui** + Radix for UI primitives
- **Zustand** for global state (`store/appStore.ts`)

## Structure

- `app/` — Routes and layouts
- `components/` — UI, shell, motion, terminal, universe
- `lib/` — utils, routes, perf (quality/reduced motion), data loaders, types
- `data/` — JSON content (projects, skills, experiments)
- `store/` — Zustand store
- `tokens/` — Design tokens (CSS + TS)

## Quality tiers

Adaptive visual quality (tier 1/2/3) is defined in `lib/perf/quality.ts` and consumed by the store. Use for R3F pixel ratio and optional LOD.

## Data

Content is data-driven: `lib/data/*.ts` load from `data/*.json`. Types in `lib/types/content.ts`.
