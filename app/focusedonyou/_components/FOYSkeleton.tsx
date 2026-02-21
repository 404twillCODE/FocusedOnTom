"use client";

import { cn } from "@/lib/cn";

export function FOYSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[var(--bg3)]",
        className
      )}
      aria-hidden
      {...props}
    />
  );
}

export function FOYCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 sm:p-7">
      <FOYSkeleton className="h-11 w-11 rounded-xl" />
      <FOYSkeleton className="mt-4 h-5 w-24" />
      <FOYSkeleton className="mt-2 h-4 w-full" />
      <FOYSkeleton className="mt-2 h-4 w-3/4" />
    </div>
  );
}
