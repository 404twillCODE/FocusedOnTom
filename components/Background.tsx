"use client";

export function Background() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Base gradients — ice blue glow, sits behind everything */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -15%, var(--iceSoft), transparent 55%)," +
            "radial-gradient(ellipse 70% 45% at 85% 30%, rgba(125, 211, 252, 0.06), transparent 50%)," +
            "radial-gradient(ellipse 60% 35% at 10% 70%, rgba(125, 211, 252, 0.05), transparent 50%)," +
            "linear-gradient(180deg, var(--bg) 0%, var(--bg2) 50%, var(--bg3) 100%)",
        }}
      />
      {/* Slow gradient pulse — one soft orb that breathes */}
      <div
        className="absolute inset-0 bg-glow-pulse"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(125, 211, 252, 0.07), transparent 55%)",
        }}
      />
      {/* Subtle animated grid — breathes so it feels alive */}
      <div
        className="absolute inset-0 bg-grid-breathe"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125, 211, 252, 0.5) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(125, 211, 252, 0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
