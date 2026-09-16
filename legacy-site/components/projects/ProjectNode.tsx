"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { tokens } from "@/tokens/tokens";
import type { Project } from "@/lib/types/content";

interface ProjectNodeProps {
  project: Project;
  x: number; // 0..1
  y: number;
  reducedMotion: boolean;
  isZooming: boolean;
  onClick: () => void;
}

const NODE_SIZE = 14;
const NODE_SIZE_HOVER = 18;

export function ProjectNode({ project, x, y, reducedMotion, isZooming, onClick }: ProjectNodeProps) {
  const [hover, setHover] = useState(false);
  const size = hover && !isZooming ? NODE_SIZE_HOVER : NODE_SIZE;

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: tokens.motion.durMed,
        ease: tokens.motion.ease,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "border-mint/60 bg-panel-solid/90",
          hover && !isZooming && "border-mint bg-mint/20 shadow-[0_0_20px_var(--mint)]"
        )}
        style={{
          width: size,
          height: size,
        }}
        aria-label={`Open ${project.name}`}
      />
      {hover && !isZooming && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-panel-solid px-3 py-2 shadow-lg"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
        >
          <p className="truncate font-medium text-text">{project.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-textMuted">{project.tagline}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
