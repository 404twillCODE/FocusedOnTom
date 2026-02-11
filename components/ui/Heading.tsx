"use client";

import { cn } from "@/lib/cn";

export function Heading({
  level,
  as,
  className,
  ...props
}: { level?: 1 | 2 | 3; as?: "h1" | "h2" | "h3" } & React.ComponentProps<"h1">) {
  const tag = as ?? (level ? `h${level}` : "h1") as "h1" | "h2" | "h3";
  const Comp = tag;
  return (
    <Comp
      className={cn("font-semibold tracking-tight text-[var(--text)]", className)}
      {...props}
    />
  );
}
