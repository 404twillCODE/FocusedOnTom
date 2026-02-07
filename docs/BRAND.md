# FocusedOnTom — Brand & Design Tokens

Premium cinematic portfolio. **Hybrid Cosmic + Cyber Lab** aesthetic: deep space backgrounds, glass surfaces, subtle glows, restrained Apple-like typography.

---

## Design tokens (centralized)

All tokens live in **`tokens/tokens.css`** (CSS) and **`tokens/tokens.ts`** (JS). Use them everywhere; do not hardcode colors or motion values.

### Colors

| Token       | Value                     | Usage                    |
|------------|---------------------------|--------------------------|
| `--bg`     | `#050812`                 | Primary background       |
| `--bg2`    | `#0A1426`                 | Gradient end / depth     |
| `--panel`  | `rgba(15,25,45,0.55)`     | Glass panels (blur)      |
| `--panelSolid` | `#0B1222`             | Solid panels             |
| `--border` | `rgba(255,255,255,0.06)`  | Borders, dividers        |
| `--text`   | `rgba(255,255,255,0.92)`  | Primary text             |
| `--textMuted` | `rgba(255,255,255,0.62)` | Secondary text           |
| `--mint`   | `#2EF2A2`                 | Accent, primary actions  |
| `--ice`    | `#7DD3FC`                 | Secondary accent         |
| `--purple` | `#A78BFA`                 | Tertiary accent          |

**Tailwind:** `bg-bg`, `bg-bg2`, `bg-panel`, `bg-panel-solid`, `border-border`, `text-text`, `text-textMuted`, `text-mint`, `text-ice`, `text-purple`, etc.

### Radii

- `--radius-panel`: `12px` — cards, panels, modals
- `--radius-pill`: `9999px` — pills, tags

### Blur & glows

- **Blur:** `--blur: 20px` — backdrop blur for glass panels
- **Glows (subtle):**
  - `--glowMint`: `0 0 25px rgba(46,242,162,0.40)`
  - `--glowIce`: `0 0 30px rgba(125,211,252,0.30)`
  - `--glowPurple`: `0 0 30px rgba(167,139,250,0.30)`

**Glow rules:** Use sparingly. One glow per focus area (e.g. terminal launcher = mint). Avoid stacking multiple glows. Prefer `none` for most panels.

### Motion

- `--dur-fast`: `150ms`
- `--dur-med`: `300ms`
- `--dur-slow`: `900ms`
- `--ease`: `cubic-bezier(0.22, 1, 0.36, 1)` — smooth, Apple-like

Use for transitions, Framer Motion, and any animated UI.

---

## Typography

- **Primary:** Space Grotesk (next/font) — headings and UI. Restrained, modern, slightly geometric.
- **Mono:** Geist Mono — code, terminal.
- Body and fallback use the same sans stack; default text color is `--text`, muted is `--textMuted`.

Use **`Heading`** (`components/ui/Heading.tsx`) with `as="h1" | "h2" | "h3"` for consistent hierarchy.

---

## Core UI primitives

- **GlassPanel** — `variant: "panel" | "solid"`, `glow: "none" | "mint" | "ice" | "purple"`. Uses tokens for background, blur, border, optional box-shadow.
- **Tag** — Small status pill (e.g. experiment tags). Uses `--border`, `--textMuted`, `--radius-pill`.
- **Heading** — h1/h2/h3 with Space Grotesk and token-based styles.

---

## Summary

- **Cosmic:** Deep blues (`--bg`, `--bg2`), subtle noise, depth.
- **Cyber Lab:** Mint/ice/purple accents, glass panels, soft glows.
- **Premium:** Restrained typography, consistent motion easing, tokens used everywhere.
