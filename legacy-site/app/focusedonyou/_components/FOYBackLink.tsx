"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function FOYBackLink({
  href,
  children,
  className,
  ariaLabel,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center gap-1 text-sm text-[var(--textMuted)] transition-colors hover:text-[var(--text)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        className
      )}
      aria-label={ariaLabel ?? undefined}
    >
      <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}
