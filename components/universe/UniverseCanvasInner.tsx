"use client";

import { Canvas } from "@react-three/fiber";
import type { QualityTier } from "@/lib/types/content";
import { QUALITY_TIERS } from "@/lib/perf/quality";
import { UniverseScene } from "./UniverseScene";

interface UniverseCanvasInnerProps {
  qualityTier: QualityTier;
  reducedMotion: boolean;
  exploreMode: "guided" | "free";
  className?: string;
}

export function UniverseCanvasInner({
  qualityTier,
  reducedMotion,
  exploreMode,
  className,
}: UniverseCanvasInnerProps) {
  const dpr = QUALITY_TIERS[qualityTier].pixelRatio;
  const frameloop = reducedMotion ? "demand" : "always";

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={[1, dpr]}
        frameloop={frameloop}
        camera={{ position: [4, 2, 6], fov: 50 }}
        gl={{ antialias: qualityTier > 1, alpha: false }}
      >
        <UniverseScene qualityTier={qualityTier} exploreMode={exploreMode} />
      </Canvas>
    </div>
  );
}
