"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Project } from "@/lib/types/content";

interface ProjectNavProps {
  prev: Project | null;
  next: Project | null;
  className?: string;
}

export function ProjectNav({ prev, next, className }: ProjectNavProps) {
  return (
    <nav
      className={cn("flex items-center justify-between gap-4 border-t border-border/60 pt-8", className)}
      aria-label="Project navigation"
    >
      <div className="min-w-0 flex-1">
        {prev ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-textMuted hover:bg-panel-solid hover:text-text"
            asChild
          >
            <Link href={ROUTES.project(prev.slug)} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">{prev.name}</span>
            </Link>
          </Button>
        ) : (
          <span className="text-textMuted/60" aria-hidden>Previous</span>
        )}
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 text-textMuted hover:bg-panel-solid hover:text-text" asChild>
        <Link href={ROUTES.projects}>All projects</Link>
      </Button>
      <div className="min-w-0 flex-1 text-right">
        {next ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-textMuted hover:bg-panel-solid hover:text-text"
            asChild
          >
            <Link href={ROUTES.project(next.slug)} className="flex items-center gap-2">
              <span className="truncate">{next.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
        ) : (
          <span className="text-textMuted/60" aria-hidden>Next</span>
        )}
      </div>
    </nav>
  );
}
