export const tokens = {
  color: {
    text: "var(--text)",
    textMuted: "var(--textMuted)",
    ice: "var(--ice)",
    border: "var(--border)",
    bg: "var(--bg)",
    bg2: "var(--bg2)",
    bg3: "var(--bg3)",
  },
  motion: {
    durFast: 0.2,
    durMed: 0.4,
    ease: [0.22, 1, 0.36, 1] as const,
  },
} as const;
