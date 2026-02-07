"use client";

import { cn } from "@/lib/cn";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border border-border px-2.5 py-0.5 text-xs font-medium text-textMuted",
        className
      )}
      {...props}
    />
  );
}
