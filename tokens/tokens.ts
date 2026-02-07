/**
 * TS mirror of FocusedOnTom design tokens for JS (Framer Motion, R3F).
 */

export const tokens = {
  motion: {
    durFast: 0.15,
    durMed: 0.3,
    durSlow: 0.9,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
  radius: {
    panel: "12px",
    pill: "9999px",
  },
  blur: 20,
  colors: {
    bg: "#050812",
    bg2: "#0a1426",
    panel: "rgba(15, 25, 45, 0.55)",
    panelSolid: "#0b1222",
    border: "rgba(255, 255, 255, 0.06)",
    text: "rgba(255, 255, 255, 0.92)",
    textMuted: "rgba(255, 255, 255, 0.62)",
    mint: "#2ef2a2",
    ice: "#7dd3fc",
    purple: "#a78bfa",
  },
} as const;
