"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { FadeIn } from "@/components/motion/FadeIn";
import { Heading } from "@/components/ui/Heading";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProjectGalaxyView } from "./ProjectGalaxyView";
import { ProjectListView } from "./ProjectListView";
import { ProjectFilters } from "./ProjectFilters";
import type { Project, ProjectStatus } from "@/lib/types/content";

type ViewMode = "galaxy" | "list";

interface ProjectsPageClientProps {
  projects: Project[];
  categories: string[];
  statuses: ProjectStatus[];
}

export function ProjectsPageClient({
  projects: initialProjects,
  categories,
  statuses,
}: ProjectsPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("galaxy");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const projects = useMemo(() => {
    let list = initialProjects;
    if (category) list = list.filter((p) => p.category === category);
    if (status) list = list.filter((p) => p.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.tech.some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialProjects, category, status, search]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <Heading as="h1">Project Galaxy</Heading>
        </FadeIn>
        <FadeIn delay={0.05}>
          <p className="mt-2 text-textMuted">
            Constellations of work—click a node to dive in.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <ProjectFilters
              categories={categories}
              statuses={statuses}
              selectedCategory={category}
              selectedStatus={status}
              searchQuery={search}
              onCategoryChange={setCategory}
              onStatusChange={setStatus}
              onSearchChange={setSearch}
            />
            <div className="flex rounded-lg border border-border/60 bg-panel/40 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 text-textMuted hover:text-text",
                  viewMode === "galaxy" && "bg-panel-solid text-mint"
                )}
                onClick={() => setViewMode("galaxy")}
                aria-pressed={viewMode === "galaxy"}
                aria-label="Galaxy view"
              >
                <LayoutGrid className="h-4 w-4" />
                Galaxy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 text-textMuted hover:text-text",
                  viewMode === "list" && "bg-panel-solid text-mint"
                )}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-6">
          {viewMode === "galaxy" ? (
            projects.length > 0 ? (
              <ProjectGalaxyView projects={projects} />
            ) : (
              <GlassPanel variant="panel" glow="none" className="flex min-h-[320px] items-center justify-center rounded-xl">
                <p className="text-textMuted">No projects match the current filters.</p>
              </GlassPanel>
            )
          ) : (
            projects.length > 0 ? (
              <ProjectListView projects={projects} />
            ) : (
              <GlassPanel variant="panel" glow="none" className="flex min-h-[200px] items-center justify-center rounded-xl">
                <p className="text-textMuted">No projects match the current filters.</p>
              </GlassPanel>
            )
          )}
        </FadeIn>
      </div>
    </AppShell>
  );
}
