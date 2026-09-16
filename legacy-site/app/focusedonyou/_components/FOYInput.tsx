"use client";

import { cn } from "@/lib/cn";

export function FOYInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5 text-base text-[var(--text)] outline-none placeholder:text-[var(--textMuted)] focus:border-[var(--ice)]/50 focus:ring-2 focus:ring-[var(--ice)]/20 focus:ring-offset-2 focus:ring-offset-[var(--bg)] focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}
