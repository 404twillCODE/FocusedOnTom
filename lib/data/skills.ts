import type { Skill, SkillCluster } from "@/lib/types/content";
import data from "@/data/skills.json";

const raw = data as SkillCluster[];

/** Constellation skill clusters (level, color, tech, summary). */
export function getSkillClusters(): SkillCluster[] {
  return raw;
}

/** Legacy: flat list for terminal etc. */
export function getSkills(): Skill[] {
  return raw.map((c) => ({ id: c.id, label: c.label, category: "Skills" }));
}

/** Legacy: single group for backward compat. */
export function getSkillsByCategory(): Map<string, Skill[]> {
  const map = new Map<string, Skill[]>();
  map.set("Skills", getSkills());
  return map;
}

/** Unique categories for filter pills. */
export function getSkillCategories(): string[] {
  const list = raw.map((s) => s.category).filter((c): c is string => Boolean(c));
  return Array.from(new Set(list)).sort();
}

export type SkillEdgeType = "orbit" | "cross-cluster";

export interface SkillEdge {
  from: string;
  to: string;
  type: SkillEdgeType;
}

/** Orbit: child → anchor per cluster. Cross-cluster: different clusters with shared keyword. */
export function getSkillConnections(skills: SkillCluster[]): SkillEdge[] {
  const edges: SkillEdge[] = [];
  const byCluster = new Map<string, SkillCluster[]>();
  for (const s of skills) {
    const region = s.cluster ?? "core";
    if (!byCluster.has(region)) byCluster.set(region, []);
    byCluster.get(region)!.push(s);
  }

  // Orbit: each non-anchor → its cluster's first anchor
  for (const list of byCluster.values()) {
    const anchor = list.find((s) => s.anchor);
    if (!anchor) continue;
    for (const s of list) {
      if (s.id === anchor.id) continue;
      edges.push({ from: s.id, to: anchor.id, type: "orbit" });
    }
  }

  // Cross-cluster: different clusters, shared keyword
  const keywords = (s: SkillCluster) => new Set((s.keywords ?? []).concat(s.tech ?? []));
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const a = skills[i]!;
      const b = skills[j]!;
      if (a.cluster === b.cluster) continue;
      const ka = keywords(a);
      const hasShared = (b.keywords ?? []).some((k) => ka.has(k)) || (b.tech ?? []).some((t) => ka.has(t));
      if (hasShared) edges.push({ from: a.id, to: b.id, type: "cross-cluster" });
    }
  }

  return edges;
}
