"use client";

/* Fixed positions and delays so twinkling stars are stable across renders */
const TWINKLE_STARS = [
  { left: "12%", top: "18%", delay: 0 },
  { left: "88%", top: "22%", delay: 0.4 },
  { left: "45%", top: "12%", delay: 1.2 },
  { left: "6%", top: "45%", delay: 0.8 },
  { left: "94%", top: "38%", delay: 1.8 },
  { left: "28%", top: "28%", delay: 0.2 },
  { left: "72%", top: "52%", delay: 1.4 },
  { left: "18%", top: "65%", delay: 2.1 },
  { left: "82%", top: "72%", delay: 0.6 },
  { left: "52%", top: "48%", delay: 1 },
  { left: "38%", top: "78%", delay: 1.6 },
  { left: "62%", top: "15%", delay: 2.3 },
  { left: "8%", top: "82%", delay: 0.3 },
  { left: "92%", top: "88%", delay: 1.1 },
  { left: "25%", top: "55%", delay: 1.9 },
  { left: "75%", top: "35%", delay: 0.7 },
  { left: "55%", top: "62%", delay: 2 },
  { left: "35%", top: "42%", delay: 0.5 },
  { left: "15%", top: "32%", delay: 1.5 },
  { left: "85%", top: "58%", delay: 0.9 },
  { left: "48%", top: "25%", delay: 2.2 },
  { left: "32%", top: "68%", delay: 0.1 },
  { left: "68%", top: "82%", delay: 1.7 },
  { left: "5%", top: "58%", delay: 1.3 },
  { left: "96%", top: "48%", delay: 0.8 },
  { left: "42%", top: "8%", delay: 2.4 },
  { left: "58%", top: "92%", delay: 0.4 },
  { left: "22%", top: "88%", delay: 1.6 },
  { left: "78%", top: "12%", delay: 0.2 },
  { left: "10%", top: "38%", delay: 2.1 },
  { left: "90%", top: "65%", delay: 0.6 },
];

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
      {/* Sparse animated starfield — soft glowing nodes that drift */}
      <div
        className="starfield-layer starfield-layer--twinkle absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(2.5px 2.5px at 20% 30%, rgba(125, 211, 252, 0.9), transparent)," +
            "radial-gradient(2.5px 2.5px at 60% 15%, rgba(125, 211, 252, 0.7), transparent)," +
            "radial-gradient(2px 2px at 85% 55%, rgba(125, 211, 252, 0.6), transparent)," +
            "radial-gradient(2px 2px at 10% 80%, rgba(125, 211, 252, 0.5), transparent)," +
            "radial-gradient(3px 3px at 45% 70%, rgba(125, 211, 252, 0.55), transparent)," +
            "radial-gradient(2px 2px at 75% 90%, rgba(125, 211, 252, 0.45), transparent)," +
            "radial-gradient(2px 2px at 30% 45%, rgba(125, 211, 252, 0.5), transparent)," +
            "radial-gradient(2.5px 2.5px at 92% 25%, rgba(125, 211, 252, 0.4), transparent)",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="starfield-layer absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(2px 2px at 15% 60%, rgba(125, 211, 252, 0.5), transparent)," +
            "radial-gradient(2px 2px at 70% 35%, rgba(125, 211, 252, 0.45), transparent)," +
            "radial-gradient(2.5px 2.5px at 50% 85%, rgba(125, 211, 252, 0.4), transparent)," +
            "radial-gradient(2px 2px at 38% 18%, rgba(125, 211, 252, 0.35), transparent)",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Individual twinkling stars — each with staggered delay */}
      {TWINKLE_STARS.map((star, i) => (
        <div
          key={i}
          className="star-twinkle absolute h-1 w-1 rounded-full bg-[var(--ice)]"
          style={{
            left: star.left,
            top: star.top,
            boxShadow: "0 0 6px rgba(125, 211, 252, 0.6)",
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
