"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { GUIDED_VIEWS, easeInOutCubic } from "@/lib/universe/views";

const WAYPOINT_DURATION = 4;
const NODE_TARGET_LERP = 0.04;
const NODE_TARGET_THRESHOLD = 0.08;

interface CameraControllerProps {
  mode: "guided" | "free";
  /** When set, guided camera lerps toward this position (e.g. from node click). */
  nodeTargetRef?: React.MutableRefObject<THREE.Vector3 | null>;
}

export function CameraController({ mode, nodeTargetRef }: CameraControllerProps) {
  const { camera } = useThree();
  const waypointIndex = useRef(0);
  const segmentProgress = useRef(0);
  const positionRef = useRef(new THREE.Vector3(4, 2, 6));
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  if (mode === "free") {
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

  // Guided: smooth path through preset views, with optional node target
  useFrame((_, delta) => {
    const targetPos = nodeTargetRef?.current;
    if (targetPos) {
      const offset = new THREE.Vector3(0.5, 0.2, 0.8).add(targetPos);
      positionRef.current.lerp(offset, NODE_TARGET_LERP);
      lookAtRef.current.lerp(targetPos, NODE_TARGET_LERP);
      camera.position.copy(positionRef.current);
      camera.lookAt(lookAtRef.current);
      if (positionRef.current.distanceTo(offset) < NODE_TARGET_THRESHOLD) {
        positionRef.current.copy(camera.position);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        lookAtRef.current.copy(camera.position).add(forward.multiplyScalar(5));
        let nearest = 0;
        let minD = Infinity;
        GUIDED_VIEWS.forEach((v, i) => {
          const d = camera.position.distanceToSquared(new THREE.Vector3(...v.position));
          if (d < minD) {
            minD = d;
            nearest = i;
          }
        });
        waypointIndex.current = nearest;
        segmentProgress.current = 0;
        nodeTargetRef.current = null;
      }
      camera.updateProjectionMatrix();
      return;
    }

    const current = GUIDED_VIEWS[waypointIndex.current];
    const nextIndex = (waypointIndex.current + 1) % GUIDED_VIEWS.length;
    const next = GUIDED_VIEWS[nextIndex];
    const dt = delta / WAYPOINT_DURATION;
    segmentProgress.current = Math.min(1, segmentProgress.current + dt);

    const eased = easeInOutCubic(segmentProgress.current);
    positionRef.current.set(
      THREE.MathUtils.lerp(current.position[0], next.position[0], eased),
      THREE.MathUtils.lerp(current.position[1], next.position[1], eased),
      THREE.MathUtils.lerp(current.position[2], next.position[2], eased)
    );
    lookAtRef.current.set(
      THREE.MathUtils.lerp(current.lookAt[0], next.lookAt[0], eased),
      THREE.MathUtils.lerp(current.lookAt[1], next.lookAt[1], eased),
      THREE.MathUtils.lerp(current.lookAt[2], next.lookAt[2], eased)
    );

    camera.position.copy(positionRef.current);
    camera.lookAt(lookAtRef.current);
    camera.updateProjectionMatrix();

    if (segmentProgress.current >= 1) {
      segmentProgress.current = 0;
      waypointIndex.current = nextIndex;
    }
  });

  return null;
}
