"use client";

import { useEffect, useState } from "react";
import { useAppStore, type AppState } from "@/store/appStore";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/cn";
import type { QualityTier } from "@/lib/types/content";

/** Mirror of UniverseScene tier counts for constellation metrics. */
const NODES_BY_TIER: Record<QualityTier, number> = {
  1: 6,
  2: 10,
  3: 16,
};

const STARS_BY_TIER: Record<QualityTier, number> = {
  1: 280,
  2: 550,
  3: 900,
};

export function DebugOverlay() {
  const devMode = useAppStore((s: AppState) => s.devMode);
  const qualityTier = useAppStore((s: AppState) => s.qualityTier);
  const exploreMode = useAppStore((s: AppState) => s.exploreMode);

  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!devMode) return;
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [devMode]);

  if (!devMode) return null;

  const tier = qualityTier as QualityTier;
  const nodes = NODES_BY_TIER[tier];
  const stars = STARS_BY_TIER[tier];

  return (
    <GlassPanel
      variant="panel"
      glow="none"
      className={cn(
        "fixed top-20 right-4 z-30 w-48 rounded-lg border border-border px-3 py-2 font-mono text-xs",
        "backdrop-blur-[var(--blur)] bg-panel/90"
      )}
      aria-label="Debug overlay"
    >
      <div className="mb-1.5 border-b border-border/60 pb-1.5 text-textMuted">
        dev
      </div>
      <dl className="space-y-1 text-text">
        <div className="flex justify-between gap-4">
          <dt className="text-textMuted">qualityTier</dt>
          <dd>{qualityTier}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-textMuted">FPS</dt>
          <dd>{fps}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-textMuted">exploreMode</dt>
          <dd>{exploreMode}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-textMuted">nodes</dt>
          <dd>{nodes}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-textMuted">stars</dt>
          <dd>{stars}</dd>
        </div>
      </dl>
    </GlassPanel>
  );
}
