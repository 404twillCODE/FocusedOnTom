"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { easeExpo } from "@/lib/motion";

type Line = string | { text: string; accent?: boolean };

type TextRevealProps = {
  lines: Line[];
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "p";
  delay?: number;
  mode?: "mount" | "view";
};

export function TextReveal({
  lines,
  className = "",
  style,
  as = "h1",
  delay = 0,
  mode = "mount",
}: TextRevealProps) {
  const reduce = useReducedMotion();
  const label = lines.map((l) => (typeof l === "string" ? l : l.text)).join(" ");

  if (reduce) {
    const Comp = as;
    return (
      <Comp className={className} style={style} aria-label={label}>
        {lines.map((line, i) => {
          const text = typeof line === "string" ? line : line.text;
          const accent = typeof line === "string" ? false : !!line.accent;
          return (
            <span key={i} className={`block ${accent ? "text-[var(--accent)]" : ""}`}>
              {text}
            </span>
          );
        })}
      </Comp>
    );
  }

  const Tag = motion[as];
  const viewProps =
    mode === "view"
      ? {
          initial: "hidden" as const,
          whileInView: "show" as const,
          viewport: { once: true, margin: "-8% 0px" as const },
        }
      : {
          initial: "hidden" as const,
          animate: "show" as const,
        };

  return (
    <Tag className={className} style={style} aria-label={label} {...viewProps}>
      {lines.map((line, i) => {
        const text = typeof line === "string" ? line : line.text;
        const accent = typeof line === "string" ? false : !!line.accent;

        return (
          <motion.span
            key={i}
            className={`block ${accent ? "text-[var(--accent)]" : ""}`}
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.85,
                  delay: delay + i * 0.11,
                  ease: easeExpo,
                },
              },
            }}
          >
            {text}
          </motion.span>
        );
      })}
    </Tag>
  );
}
