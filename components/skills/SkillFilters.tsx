"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface SkillFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  sortByLevel: boolean;
  onSortChange: (value: boolean) => void;
  className?: string;
}

export function SkillFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  sortByLevel,
  onSortChange,
  className,
}: SkillFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-panel/40 px-3 py-2 backdrop-blur-[var(--blur)]",
        className
      )}
    >
      <Input
        type="search"
        placeholder="Search skills..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-36 border-border bg-panel-solid text-text placeholder:text-textMuted sm:w-44"
        aria-label="Search skills"
      />
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onCategoryChange("")}
          className={cn(
            "rounded-md border px-2 py-1 font-mono text-[10px] uppercase transition-colors",
            !categoryFilter
              ? "border-mint/50 bg-mint/10 text-mint"
              : "border-border bg-panel-solid/80 text-textMuted hover:text-text"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(categoryFilter === cat ? "" : cat)}
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] uppercase transition-colors",
              categoryFilter === cat
                ? "border-mint/50 bg-mint/10 text-mint"
                : "border-border bg-panel-solid/80 text-textMuted hover:text-text"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSortChange(!sortByLevel)}
        className={cn(
          "ml-auto rounded-md border px-2 py-1 font-mono text-[10px] uppercase transition-colors",
          sortByLevel
            ? "border-ice/50 bg-ice/10 text-ice"
            : "border-border bg-panel-solid/80 text-textMuted hover:text-text"
        )}
      >
        {sortByLevel ? "Level ↓" : "Level"}
      </button>
    </div>
  );
}
