"use client";

import { GlassPanel } from "@/components/shell/GlassPanel";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { Project, ProjectStatus } from "@/lib/types/content";

const STATUS_CLASS: Record<ProjectStatus, string> = {
  Live: "bg-mint/20 text-mint border-mint/40",
  Building: "bg-ice/20 text-ice border-ice/40",
  Archived: "bg-textMuted/20 text-textMuted border-border",
  Concept: "bg-purple/20 text-purple border-purple/40",
};

interface ProjectMetaProps {
  project: Project;
  className?: string;
}

export function ProjectMeta({ project, className }: ProjectMetaProps) {
  return (
    <GlassPanel
      variant="panel"
      glow="none"
      className={cn(
        "sticky top-24 border border-border/80 bg-panel/80 p-4 backdrop-blur-[var(--blur)]",
        className
      )}
    >
      <dl className="space-y-4">
        {project.year != null && (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-textMuted">Year</dt>
            <dd className="mt-0.5 text-sm text-text">{project.year}</dd>
          </div>
        )}
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-textMuted">Category</dt>
          <dd className="mt-0.5 text-sm text-text">{project.category}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-textMuted">Status</dt>
          <dd className="mt-0.5">
            <span
              className={cn(
                "inline-block rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                STATUS_CLASS[project.status]
              )}
            >
              {project.status}
            </span>
          </dd>
        </div>
        {project.tech.length > 0 && (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-textMuted">Tech</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <Tag key={t} className="bg-panel-solid/80 text-text border-border text-[10px]">
                  {t}
                </Tag>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </GlassPanel>
  );
}
