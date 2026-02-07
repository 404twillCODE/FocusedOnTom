"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const WAYPOINTS: [number, number, number][] = [
  [4, 2, 6],
  [0, 1, 8],
  [-4, 2, 6],
];

const LERP_SPEED = 0.15;

/**
 * Scripted camera path: lerps between 3 positions in a loop.
 * Used when exploreMode === "guided".
 */
export function GuidedMode() {
  const { camera } = useThree();
  const waypointIndex = useRef(0);
  const progress = useRef(0);

  useFrame(() => {
    const target = new THREE.Vector3(...WAYPOINTS[waypointIndex.current]);
    camera.position.lerp(target, LERP_SPEED);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    progress.current += LERP_SPEED;
    if (progress.current >= 1) {
      progress.current = 0;
      waypointIndex.current = (waypointIndex.current + 1) % WAYPOINTS.length;
    }
  });

  return null;
}
