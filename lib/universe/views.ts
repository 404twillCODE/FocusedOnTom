import type * as THREE from "three";

export interface CameraView {
  name: string;
  position: [number, number, number];
  lookAt: [number, number, number];
}

/** Preset camera views for guided exploration. */
export const GUIDED_VIEWS: CameraView[] = [
  {
    name: "hero",
    position: [4, 2, 6],
    lookAt: [0, 0, 0],
  },
  {
    name: "skills",
    position: [5, 0.5, 5],
    lookAt: [0, 0, 0],
  },
  {
    name: "projects",
    position: [-3.5, 2, 5.5],
    lookAt: [0, 0, 0],
  },
  {
    name: "lab",
    position: [2, -1.2, 6],
    lookAt: [0, 0, 0],
  },
  {
    name: "lifestyle",
    position: [-2, 3, 4.5],
    lookAt: [0, 0, 0],
  },
];

/** Smooth easing: ease-in-out cubic. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
