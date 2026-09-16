"use client";

/**
 * Subtle grid background for a card (e.g. Nodexity).
 */
export function GridCardBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none opacity-[0.06]"
      aria-hidden
      style={{
        backgroundImage:
          "linear-gradient(rgba(125, 211, 252, 0.6) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(125, 211, 252, 0.6) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    />
  );
}
