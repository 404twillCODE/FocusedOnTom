import type { Project } from "@/lib/types/content";

/** Simple deterministic hash from string to 0..1. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) / 2147483647;
}

export interface NodePosition {
  slug: string;
  x: number; // 0..1 normalized
  y: number;
}

/** Deterministic pseudo-random layout: each project gets a stable position in the unit square. */
export function getNodePositions(projects: Project[]): NodePosition[] {
  const centerX = 0.5;
  const centerY = 0.5;
  const spread = 0.42;

  return projects.map((p, i) => {
    const a = hash(p.slug + "angle") * Math.PI * 2;
    const r = spread * (0.4 + hash(p.slug + "radius") * 0.6);
    const x = centerX + r * Math.cos(a);
    const y = centerY + r * Math.sin(a);
    return { slug: p.slug, x, y };
  });
}

export interface Edge {
  from: string;
  to: string;
}

/** Edges between projects that share category or at least one tech. */
export function getEdges(projects: Project[]): Edge[] {
  const edges: Edge[] = [];
  const slugSet = new Set(projects.map((p) => p.slug));

  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const a = projects[i];
      const b = projects[j];
      const sameCategory = a.category === b.category;
      const sharedTech = a.tech.some((t) => b.tech.includes(t));
      if ((sameCategory || sharedTech) && slugSet.has(a.slug) && slugSet.has(b.slug)) {
        edges.push({ from: a.slug, to: b.slug });
      }
    }
  }
  return edges;
}
