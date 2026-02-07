"use client";

import { cn } from "@/lib/cn";

type HeadingLevel = "h1" | "h2" | "h3";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
}

const styles: Record<HeadingLevel, string> = {
  h1: "text-4xl font-semibold tracking-tight text-text md:text-5xl",
  h2: "text-3xl font-semibold tracking-tight text-text md:text-4xl",
  h3: "text-xl font-medium tracking-tight text-text md:text-2xl",
};

export function Heading({ as = "h1", className, ...props }: HeadingProps) {
  const Comp = as;
  return <Comp className={cn(styles[as], className)} {...props} />;
}
