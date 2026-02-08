import type { Project, ProjectStatus } from "@/lib/types/content";
import data from "@/data/projects.json";

const projects = data as Project[];

export function getProjects(): Project[] {
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}

/** Unique categories for filters. */
export function getProjectCategories(): string[] {
  const set = new Set(projects.map((p) => p.category));
  return Array.from(set).sort();
}

/** Unique statuses for filters. */
export function getProjectStatuses(): ProjectStatus[] {
  const set = new Set(projects.map((p) => p.status));
  return Array.from(set);
}

/** Group projects by category for list view. */
export function getProjectsByCategory(): Map<string, Project[]> {
  const map = new Map<string, Project[]>();
  for (const p of projects) {
    const list = map.get(p.category) ?? [];
    list.push(p);
    map.set(p.category, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }
  return map;
}

/** Ordered list for nav: featured first, then alphabetical by name. */
function getProjectsForNav(): Project[] {
  return [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Previous and next project for slug. Based on featured-first, then alphabetical. */
export function getProjectNav(slug: string): { prev: Project | null; next: Project | null } {
  const ordered = getProjectsForNav();
  const i = ordered.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? ordered[i - 1]! : null,
    next: i < ordered.length - 1 ? ordered[i + 1]! : null,
  };
}
