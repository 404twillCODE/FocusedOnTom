import type { SkillCluster } from "@/lib/types/content";

export interface SkillEdge {
  from: string;
  to: string;
  type?: string;
}

const clusters: SkillCluster[] = [];
const categories: string[] = [];

export function getSkillClusters(): SkillCluster[] {
  return clusters;
}

export function getSkillCategories(): string[] {
  return categories;
}

export function getSkillConnections(_clusters: SkillCluster[]): SkillEdge[] {
  return [];
}
