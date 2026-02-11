"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Button({
  className,
  variant,
  size,
  asChild,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: string;
  size?: string;
  asChild?: boolean;
}) {
  const base =
    "rounded-xl border border-[var(--border)] bg-[var(--bg3)]/80 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/50 hover:text-[var(--ice)]";
  const cls = cn(base, className);

  if (asChild && React.isValidElement(children) && children.type === Link) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn((children.props as { className?: string }).className, cls),
    });
  }
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn((children.props as { className?: string }).className, cls),
    });
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
