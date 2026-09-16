"use client";

import { cn } from "@/lib/cn";

export function FOYCard({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-colors duration-200 hover:border-[var(--ice)]/25 hover:bg-[var(--iceSoft)]/20 sm:p-7",
        className
      )}
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.12)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
