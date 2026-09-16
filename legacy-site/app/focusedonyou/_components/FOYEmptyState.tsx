"use client";

import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function FOYEmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20",
        className
      )}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--iceSoft)] text-[var(--ice)]"
        aria-hidden
      >
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-[var(--text)]">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-[var(--textMuted)] text-[1rem] leading-relaxed">
        {description}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
