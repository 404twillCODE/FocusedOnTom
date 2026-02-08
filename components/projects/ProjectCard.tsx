"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/routes";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { Project, ProjectStatus } from "@/lib/types/content";
import { tokens } from "@/tokens/tokens";

const STATUS_CLASS: Record<ProjectStatus, string> = {
  Live: "bg-mint/20 text-mint border-mint/40",
  Building: "bg-ice/20 text-ice border-ice/40",
  Archived: "bg-textMuted/20 text-textMuted border-border",
  Concept: "bg-purple/20 text-purple border-purple/40",
};

interface ProjectCardProps {
  project: Project;
  index: number;
  reducedMotion: boolean;
}

export function ProjectCard({ project, index, reducedMotion }: ProjectCardProps) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: tokens.motion.durMed,
        ease: tokens.motion.ease,
        delay: index * 0.04,
      }}
    >
      <Link href={ROUTES.project(project.slug)} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-[var(--radius-panel)]">
        <GlassPanel
          variant="panel"
          glow="none"
          className={cn(
            "p-4 transition-all duration-200",
            "hover:border-mint/30 hover:bg-panel/90"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-text">{project.name}</h3>
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                STATUS_CLASS[project.status]
              )}
            >
              {project.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-textMuted">{project.tagline}</p>
          {project.tech.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <Tag key={t} className="text-[10px]">
                  {t}
                </Tag>
              ))}
            </div>
          )}
          {project.year && (
            <p className="mt-2 text-xs text-textMuted/80">{project.year}</p>
          )}
        </GlassPanel>
      </Link>
    </motion.div>
  );
}
