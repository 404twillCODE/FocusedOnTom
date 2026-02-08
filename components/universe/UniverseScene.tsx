"use client";

import { useRef, useMemo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { QualityTier } from "@/lib/types/content";
import { CameraController } from "./CameraController";

const NODES_BY_TIER: Record<QualityTier, number> = {
  1: 6,
  2: 10,
  3: 16,
};

const STARS_BY_TIER: Record<QualityTier, number> = {
  1: 120,
  2: 250,
  3: 450,
};

/** Deterministic positions on a sphere for nodes (seed-based). */
function nodePositions(count: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const r = 3 + (i % 3) * 0.8;
    out.push([
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi),
    ]);
  }
  return out;
}

/** Seeded random for deterministic star positions (no animation required). */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    const t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    return ((t + (t ^ (t >>> 7)) >>> 0) / 4294967296) as number;
  };
}

/** Star field; density scales with quality tier. Renders behind nodes/lines, above base. */
function StarField({ qualityTier }: { qualityTier: QualityTier }) {
  const count = STARS_BY_TIER[qualityTier];
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = seeded(qualityTier * 12345);
    for (let i = 0; i < count; i++) {
      const r = 18 + rnd() * 28;
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, qualityTier]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        transparent
        opacity={0.92}
        color="#8dd8fc"
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Nodes (spheres) + lines; nodes are clickable to move camera. */
function NodesAndLines({
  qualityTier,
  nodeTargetRef,
}: {
  qualityTier: QualityTier;
  nodeTargetRef: React.MutableRefObject<THREE.Vector3 | null>;
}) {
  const count = NODES_BY_TIER[qualityTier];
  const positions = useMemo(() => nodePositions(count), [count]);

  const lineSegments = useMemo(() => {
    const segs: Float32Array[] = [];
    for (let i = 0; i < positions.length - 1; i += 2) {
      const [a, b] = [positions[i], positions[i + 1]];
      segs.push(new Float32Array([a[0], a[1], a[2], b[0], b[1], b[2]]));
    }
    if (positions.length >= 3) {
      const [a, b] = [positions[0], positions[2]];
      segs.push(new Float32Array([a[0], a[1], a[2], b[0], b[1], b[2]]));
    }
    return segs;
  }, [positions]);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          onClick={(e) => {
            e.stopPropagation();
            nodeTargetRef.current = e.point.clone();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[0.06, 12, 8]} />
          <meshBasicMaterial color="#2ef2a2" transparent opacity={0.9} />
        </mesh>
      ))}
      {lineSegments.map((arr, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[arr, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#a78bfa" transparent opacity={0.4} />
        </line>
      ))}
    </>
  );
}

interface UniverseSceneProps {
  qualityTier: QualityTier;
  exploreMode: "guided" | "free";
}

function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color("#050812");
    return () => {
      scene.background = null;
    };
  }, [scene]);
  return null;
}

export function UniverseScene({ qualityTier, exploreMode }: UniverseSceneProps) {
  const nodeTargetRef = useRef<THREE.Vector3 | null>(null);

  return (
    <>
      <SceneBackground />
      <StarField qualityTier={qualityTier} />
      <NodesAndLines qualityTier={qualityTier} nodeTargetRef={nodeTargetRef} />
      <CameraController mode={exploreMode} nodeTargetRef={nodeTargetRef} />
    </>
  );
}
