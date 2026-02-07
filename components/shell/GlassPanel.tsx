"use client";

import { cn } from "@/lib/cn";

type PanelVariant = "panel" | "solid";
type GlowVariant = "none" | "mint" | "ice" | "purple";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  glow?: GlowVariant;
}

const glowMap: Record<Exclude<GlowVariant, "none">, string> = {
  mint: "var(--glowMint)",
  ice: "var(--glowIce)",
  purple: "var(--glowPurple)",
};

export function GlassPanel({
  variant = "panel",
  glow = "none",
  className,
  style,
  ...props
}: GlassPanelProps) {
  const isGlass = variant === "panel";
  const glowValue = glow === "none" ? undefined : glowMap[glow];

  return (
    <div
      className={cn("rounded-[var(--radius-panel)] border", className)}
      style={{
        background: isGlass ? "var(--panel)" : "var(--panelSolid)",
        backdropFilter: isGlass ? `blur(var(--blur))` : undefined,
        WebkitBackdropFilter: isGlass ? `blur(var(--blur))` : undefined,
        borderColor: "var(--border)",
        boxShadow: glowValue ? glowValue : undefined,
        ...style,
      }}
      {...props}
    />
  );
}
