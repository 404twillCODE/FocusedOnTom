import type { QualityTier } from "@/lib/types/content";
import { getPrefersReducedMotion } from "./reducedMotion";

export const QUALITY_TIERS: Record<QualityTier, { label: string; pixelRatio: number }> = {
  1: { label: "Low", pixelRatio: 1 },
  2: { label: "Medium", pixelRatio: 1.5 },
  3: { label: "High", pixelRatio: 2 },
};

const FPS_SAMPLE_COUNT = 120;
const FPS_TIER_1_MAX = 45;
const FPS_TIER_2_MAX = 55;

/**
 * Samples FPS over ~120 frames via requestAnimationFrame.
 * Returns average FPS (frames per second).
 */
export function sampleFps(sampleCount: number = FPS_SAMPLE_COUNT): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(60);
      return;
    }
    const frameTimes: number[] = [];
    let lastTime = performance.now();

    function onFrame() {
      const now = performance.now();
      frameTimes.push(1000 / (now - lastTime));
      lastTime = now;
      if (frameTimes.length < sampleCount) {
        requestAnimationFrame(onFrame);
      } else {
        const sum = frameTimes.reduce((a, b) => a + b, 0);
        const avgFps = sum / frameTimes.length;
        resolve(avgFps);
      }
    }

    requestAnimationFrame(onFrame);
  });
}

/**
 * Determines quality tier at runtime using:
 * - prefers-reduced-motion (force tier 1)
 * - devicePixelRatio, deviceMemory (hints)
 * - FPS sampling over ~120 frames: <45 => 1, 45–55 => 2, >55 => 3
 * Resilient: fallback tier 2 on any error or SSR.
 */
export async function determineQualityTier(): Promise<QualityTier> {
  try {
    if (typeof window === "undefined") return 2;

    if (getPrefersReducedMotion()) return 1;

    const fps = await sampleFps(FPS_SAMPLE_COUNT);

    if (fps < FPS_TIER_1_MAX) return 1;
    if (fps <= FPS_TIER_2_MAX) return 2;
    return 3;
  } catch {
    return 2;
  }
}
