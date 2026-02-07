"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/cn";

const UniverseCanvasInner = dynamic(
  () =>
    import("./UniverseCanvasInner").then((m) => ({ default: m.UniverseCanvasInner })),
  { ssr: false }
);

interface UniverseMountProps {
  className?: string;
}

/**
 * Universe navigation engine. Lazy-loads the R3F canvas.
 * - guided: cinematic camera path (hero → skills → projects → lab → lifestyle), node click moves camera.
 * - free: OrbitControls for full exploration.
 * Respects qualityTier (DPR, star/node density), reducedMotion (frameloop).
 * pointer-events: auto only in free mode so background UI stays clickable when guided.
 */
export function UniverseMount({ className }: UniverseMountProps) {
  const qualityTier = useAppStore((s) => s.qualityTier);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const exploreMode = useAppStore((s) => s.exploreMode);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        pointerEvents: exploreMode === "free" ? "auto" : "none",
      }}
    >
      <UniverseCanvasInner
        qualityTier={qualityTier}
        reducedMotion={reducedMotion}
        exploreMode={exploreMode}
        className="absolute inset-0"
      />
    </div>
  );
}
