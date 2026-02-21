"use client";

import { cn } from "@/lib/cn";

export function FOYContainer({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[min(100%,theme(maxWidth.5xl))] px-4 sm:px-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
