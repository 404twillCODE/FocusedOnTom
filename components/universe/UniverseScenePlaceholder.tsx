"use client";

import { cn } from "@/lib/cn";

interface UniverseScenePlaceholderProps {
  className?: string;
}

/**
 * Placeholder for the R3F canvas content.
 * Replace with actual Three.js scene when implementing 3D.
 */
export function UniverseScenePlaceholder({ className }: UniverseScenePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] items-center justify-center rounded-[var(--radius-panel)] border border-dashed border-border bg-panel/50",
        className
      )}
    >
      <span className="text-sm text-textMuted">Universe scene (R3F placeholder)</span>
    </div>
  );
}
