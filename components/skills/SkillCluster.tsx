"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { SkillCluster } from "@/lib/types/content";
import { tokens } from "@/tokens/tokens";

const RING_RADII = [28, 44, 60];
const CENTER = 64;
const STAR_R = 10;
const TECH_R = 4;

function getRingCount(level: number): number {
  if (level >= 90) return 3;
  if (level >= 70) return 2;
  return 1;
}

function getTechPositions(count: number, ringIndex: number): { x: number; y: number }[] {
  const r = RING_RADII[ringIndex] ?? RING_RADII[0];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    out.push({
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    });
  }
  return out;
}

export type SkillClusterMode = "map" | "list";

interface SkillClusterProps {
  skill: SkillCluster;
  index: number;
  reducedMotion: boolean;
  onSelect: (skill: SkillCluster) => void;
  mode?: SkillClusterMode;
  /** In map mode: anchor = larger glow, pulse; child = smaller. */
  isAnchor?: boolean;
  /** Pause internal orbit animation when hovering (map mode). */
  orbitPaused?: boolean;
}

export function SkillClusterView({
  skill,
  index,
  reducedMotion,
  onSelect,
  mode = "list",
  isAnchor = false,
  orbitPaused = false,
}: SkillClusterProps) {
  const ringCount = useMemo(() => getRingCount(skill.level ?? 0), [skill.level]);
  const isHighLevel = (skill.level ?? 0) >= 90;
  const isMap = mode === "map";
  const showAnchorStyle = isMap && isAnchor;

  const techPerRing = useMemo(() => {
    const total = Math.min((skill.tech ?? []).length, ringCount * 4);
    const perRing: number[] = [];
    let left = total;
    for (let r = 0; r < ringCount; r++) {
      const max = 4;
      const n = Math.min(max, left);
      perRing.push(n);
      left -= n;
    }
    return perRing;
  }, [(skill.tech ?? []).length, ringCount]);

  const techPositions = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    techPerRing.forEach((n, ri) => {
      getTechPositions(n, ri).forEach((p) => out.push(p));
    });
    return out;
  }, [techPerRing]);

  const duration = isHighLevel ? 18 : 24;
  const orbitDuration = reducedMotion || orbitPaused ? 0 : duration;

  return (
    <motion.button
      type="button"
      className={cn(
        "group relative flex items-center justify-center rounded-xl border border-border/60 bg-panel/40 transition-colors",
        "hover:border-[var(--cluster-color)]/50 hover:bg-panel/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        isMap
          ? "min-h-0 w-full flex-col gap-1 py-2"
          : "h-full min-h-[180px] w-full"
      )}
      style={{ ["--cluster-color" as string]: skill.color }}
      initial={
        reducedMotion || isMap
          ? false
          : { opacity: 0, scale: 0.92 }
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: tokens.motion.durMed,
        delay: isMap ? 0 : index * 0.06,
        ease: tokens.motion.ease,
      }}
      whileHover={reducedMotion ? undefined : { scale: 1.05 }}
      onClick={() => onSelect(skill)}
      aria-label={`Open ${skill.label}`}
    >
      <svg
        viewBox="0 0 128 128"
        className={cn(
          "shrink-0 overflow-visible",
          isMap ? (showAnchorStyle ? "h-16 w-16" : "h-14 w-14") : "h-28 w-28"
        )}
        aria-hidden
      >
        <defs>
          <filter id={`glow-${skill.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glow-strong-${skill.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glow-anchor-${skill.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Orbit rings (group rotated around center) */}
        <motion.g
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{
            duration: orbitDuration === 0 ? 1 : orbitDuration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {Array.from({ length: ringCount }).map((_, ri) => {
            const r = RING_RADII[ri]!;
            const strokeW = showAnchorStyle ? 1.5 : 1;
            const strokeO = showAnchorStyle ? 0.5 : 0.4;
            return (
              <ellipse
                key={ri}
                cx={CENTER}
                cy={CENTER}
                rx={r}
                ry={r * 0.6}
                fill="none"
                stroke={skill.color}
                strokeWidth={strokeW}
                strokeOpacity={strokeO}
                className="group-hover:stroke-opacity-60"
              />
            );
          })}
        </motion.g>
        {/* Tech nodes */}
        {techPositions.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={showAnchorStyle ? TECH_R + 0.5 : TECH_R}
            fill={skill.color}
            opacity="0.7"
            className="group-hover:opacity-90"
          />
        ))}
        {/* Center star: anchor = larger, stronger glow, pulse */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={showAnchorStyle ? STAR_R + 2 : STAR_R}
          fill={skill.color}
          filter={
            showAnchorStyle
              ? `url(#glow-anchor-${skill.id})`
              : isHighLevel
                ? `url(#glow-strong-${skill.id})`
                : `url(#glow-${skill.id})`
          }
          opacity={showAnchorStyle ? 0.98 : isHighLevel ? 0.95 : 0.85}
          className="group-hover:opacity-100"
          animate={
            showAnchorStyle && !reducedMotion
              ? { opacity: [0.92, 0.98, 0.92] }
              : undefined
          }
          transition={
            showAnchorStyle && !reducedMotion
              ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      </svg>
      <span
        className={cn(
          "font-mono text-xs font-medium text-text",
          isMap ? "text-center" : "absolute bottom-3 left-0 right-0 text-center"
        )}
      >
        {skill.label}
      </span>
    </motion.button>
  );
}
