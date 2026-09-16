import type { SkillCluster, SkillClusterRegion } from "@/lib/types/content";

/** Deterministic hash from string to 0..1. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) / 2147483647;
}

/** Cluster region centers (x, y in 0..1). core=center, creative=upper-right, systems=lower-right, experimental=left */
const REGION_CENTERS: Record<SkillClusterRegion, [number, number]> = {
  core: [0.5, 0.5],
  creative: [0.72, 0.28],
  systems: [0.68, 0.72],
  experimental: [0.22, 0.5],
};

const NODE_W = 0.12;
const NODE_H = 0.14;

/** Orbit radius for child (0..1) from weight 1-5. Higher weight = closer. */
function orbitRadiusFromWeight(weight: number): number {
  const w = Math.max(1, Math.min(5, weight));
  return 0.06 + (5 - w) * 0.02;
}

export interface ClusterPosition {
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  /** For connection styling and orbit drift. */
  isAnchor: boolean;
  /** 0 = anchor (no drift), 1 = child (drift). */
  depth: number;
  /** Anchor id this node orbits (if child). */
  anchorId?: string;
}

/**
 * Radial cluster layout: anchors at region centers, children orbit anchors.
 * Deterministic (hash-based angles).
 */
export function getClusterPositions(skills: SkillCluster[]): ClusterPosition[] {
  const positions: ClusterPosition[] = [];
  const byCluster = new Map<SkillClusterRegion, SkillCluster[]>();

  for (const s of skills) {
    const region: SkillClusterRegion = (s.cluster ?? s.region ?? "core") as SkillClusterRegion;
    if (!byCluster.has(region)) byCluster.set(region, []);
    byCluster.get(region)!.push(s);
  }

  const anchorPositions = new Map<string, { cx: number; cy: number }>();

  // 1) Position anchors at region centers (with tiny offset per anchor in same region)
  for (const [region, list] of byCluster) {
    const [rx, ry] = REGION_CENTERS[region];
    const anchors = list.filter((s) => s.anchor);
    anchors.forEach((s, i) => {
      const offset = anchors.length > 1 ? (i - (anchors.length - 1) / 2) * 0.06 : 0;
      const cx = rx + offset * 0.5;
      const cy = ry + offset * 0.3;
      anchorPositions.set(s.id, { cx, cy });
      positions.push({
        id: s.id,
        x: cx - NODE_W / 2,
        y: cy - NODE_H / 2,
        centerX: cx,
        centerY: cy,
        isAnchor: true,
        depth: 0,
      });
    });
  }

  // 2) Position non-anchors: orbit around their cluster's first anchor
  for (const [region, list] of byCluster) {
    const anchors = list.filter((s) => s.anchor);
    const anchor = anchors[0];
    if (!anchor) continue;
    const center = anchorPositions.get(anchor.id);
    if (!center) continue;

    const children = list.filter((s) => !s.anchor);
    children.forEach((s, i) => {
      const radius = orbitRadiusFromWeight(Number(s.weight ?? 3));
      const angle = 2 * Math.PI * (hash(s.id + "angle") + i * 0.25);
      const cx = center.cx + radius * Math.cos(angle);
      const cy = center.cy + radius * 0.6 * Math.sin(angle);
      positions.push({
        id: s.id,
        x: cx - NODE_W / 2,
        y: cy - NODE_H / 2,
        centerX: cx,
        centerY: cy,
        isAnchor: false,
        depth: 1,
        anchorId: anchor.id,
      });
    });
  }

  return positions;
}
