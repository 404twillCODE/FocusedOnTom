"use client";

import { cn } from "@/lib/cn";

export function Tag({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg3)]/80 px-2.5 py-1 text-xs text-[var(--textMuted)]",
        className
      )}
      {...props}
    />
  );
}
