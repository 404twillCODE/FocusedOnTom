"use client";

import { useMemo } from "react";
import { useAppStore, type AppState } from "@/store/appStore";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/types/content";

interface ProjectListViewProps {
  projects: Project[];
}

export function ProjectListView({ projects }: ProjectListViewProps) {
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);

  const byCategory = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of projects) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    }
    const order = Array.from(map.keys()).sort();
    return order.map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [projects]);

  return (
    <div className="space-y-8">
      {byCategory.map(({ category, items }) => (
        <section key={category}>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-textMuted">
            {category}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project, i) => (
              <li key={project.slug}>
                <ProjectCard
                  project={project}
                  index={i}
                  reducedMotion={reducedMotion}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
