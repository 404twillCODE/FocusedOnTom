"use client";

import { OrbitControls } from "@react-three/drei";

/**
 * Orbit controls for free camera movement.
 * Used when exploreMode === "free".
 */
export function FreeMode() {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2 + 0.2}
    />
  );
}
