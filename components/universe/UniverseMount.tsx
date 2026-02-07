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
 * R3F Canvas mount. Lazy-loads the 3D scene.
 * Respects qualityTier (DPR, node count), reducedMotion (frameloop),
 * and exploreMode (guided path vs orbit controls).
 * Use pointer-events: none on the wrapper when used as background so UI stays interactive.
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
