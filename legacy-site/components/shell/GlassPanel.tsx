"use client";

import { cn } from "@/lib/cn";

export function GlassPanel({
  children,
  className,
  variant,
  glow,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: string;
  glow?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
