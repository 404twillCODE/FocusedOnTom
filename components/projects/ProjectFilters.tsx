"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { Project, ProjectStatus } from "@/lib/types/content";

interface ProjectFiltersProps {
  categories: string[];
  statuses: ProjectStatus[];
  selectedCategory: string;
  selectedStatus: string;
  searchQuery: string;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function ProjectFilters({
  categories,
  statuses,
  selectedCategory,
  selectedStatus,
  searchQuery,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  className,
}: ProjectFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-panel/40 px-3 py-2 backdrop-blur-[var(--blur)]",
        className
      )}
    >
      <Input
        type="search"
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-40 border-border bg-panel-solid text-text placeholder:text-textMuted md:w-52"
        aria-label="Search projects"
      />
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-panel-solid px-2 text-sm text-text focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-panel-solid px-2 text-sm text-text focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
