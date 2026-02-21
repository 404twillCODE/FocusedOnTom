"use client";

import { cn } from "@/lib/cn";

export function FOYSectionTitle({
  children,
  className,
  as: As = "h2",
  ...props
}: React.ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3" }) {
  const Comp = As;
  return (
    <Comp
      className={cn(
        "text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl sm:text-3xl",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
