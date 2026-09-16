"use client";

import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50",
        className
      )}
      {...props}
    />
  );
}
