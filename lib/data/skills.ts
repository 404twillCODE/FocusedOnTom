import type { Skill } from "@/lib/types/content";
import data from "@/data/skills.json";

const skills = data as Skill[];

export function getSkills(): Skill[] {
  return skills;
}

export function getSkillsByCategory(): Map<string, Skill[]> {
  const map = new Map<string, Skill[]>();
  for (const s of skills) {
    const cat = s.category ?? "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(s);
  }
  return map;
}
