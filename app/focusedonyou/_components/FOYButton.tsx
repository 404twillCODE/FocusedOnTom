"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

const base =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary:
    "border-[var(--ice)]/40 bg-[var(--iceSoft)] text-[var(--ice)] hover:border-[var(--ice)]/60 hover:bg-[var(--ice)]/20",
  secondary:
    "border-[var(--border)] bg-[var(--bg3)]/80 text-[var(--text)] hover:border-[var(--ice)]/50 hover:text-[var(--ice)]",
  ghost:
    "border-transparent bg-transparent text-[var(--textMuted)] hover:bg-[var(--bg3)]/60 hover:text-[var(--text)]",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
};

export function FOYButton({
  className,
  variant = "secondary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function FOYButtonLink({
  href,
  className,
  variant = "secondary",
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: keyof typeof variants }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
