"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { SkillClusterView } from "./SkillCluster";
import { SkillConnections } from "./SkillConnections";
import { getClusterPositions } from "@/lib/skills/constellationLayout";
import { getSkillConnections } from "@/lib/data/skills";
import type { SkillCluster } from "@/lib/types/content";
import type { ClusterPosition } from "@/lib/skills/constellationLayout";
import { tokens } from "@/tokens/tokens";

/** Parallax: anchors move less (depth 0), children more (depth 1). */
const PARALLAX_ANCHOR = 8;
const PARALLAX_CHILD = 18;

const ORBIT_PERIOD_MS = 60_000;
const TAU = 2 * Math.PI;

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) / 2147483647) * TAU;
}

function driftPosition(pos: ClusterPosition, phase: number, posById: Map<string, ClusterPosition>): ClusterPosition {
  if (!pos.anchorId) return pos;
  const anchor = posById.get(pos.anchorId);
  if (!anchor) return pos;
  const ax = anchor.centerX;
  const ay = anchor.centerY;
  const dx = pos.centerX - ax;
  const dy = pos.centerY - ay;
  const angle = phase + hashPhase(pos.id);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const newCx = ax + dx * cos - dy * sin;
  const newCy = ay + dx * sin + dy * cos;
  const nw = 0.12 / 2;
  const nh = 0.14 / 2;
  return {
    ...pos,
    centerX: newCx,
    centerY: newCy,
    x: newCx - nw,
    y: newCy - nh,
  };
}

interface SkillMapProps {
  skills: SkillCluster[];
  reducedMotion: boolean;
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
  onSelect: (skill: SkillCluster) => void;
}

export function SkillMap({
  skills,
  reducedMotion,
  hoveredId,
  onHoverChange,
  onSelect,
}: SkillMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [orbitPhase, setOrbitPhase] = useState(0);

  const positions = useMemo(() => getClusterPositions(skills), [skills]);
  const edges = getSkillConnections(skills);
  const posById = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);

  const driftedPositions = useMemo(() => {
    if (reducedMotion || hoveredId) return positions;
    return positions.map((p) => driftPosition(p, orbitPhase, posById));
  }, [positions, posById, orbitPhase, reducedMotion, hoveredId]);

  useEffect(() => {
    if (reducedMotion || hoveredId) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / ORBIT_PERIOD_MS;
      setOrbitPhase((t % 1) * TAU);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, hoveredId]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setParallax({ x: dx, y: dy });
    },
    [reducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
    onHoverChange(null);
  }, [onHoverChange]);

  return (
    <GlassPanel
      variant="panel"
      glow="none"
      className="relative min-h-[70vh] w-full overflow-hidden rounded-xl border border-border/60 bg-panel/30"
    >
      <div
        ref={containerRef}
        className="relative h-full min-h-[70vh] w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <SkillConnections
          positions={driftedPositions}
          edges={edges}
          hoveredId={hoveredId}
        />
        {skills.map((skill, index) => {
          const pos = driftedPositions.find((p) => p.id === skill.id);
          if (!pos) return null;
          const parallaxFactor = pos.depth === 0 ? PARALLAX_ANCHOR : PARALLAX_CHILD;
          const px = reducedMotion ? 0 : parallax.x * parallaxFactor;
          const py = reducedMotion ? 0 : parallax.y * parallaxFactor;
          return (
            <motion.div
              key={skill.id}
              className="absolute z-10 w-[140px] max-w-[20%]"
              style={{
                left: `calc(${pos.x * 100}% + ${px}px)`,
                top: `calc(${pos.y * 100}% + ${py}px)`,
              }}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: tokens.motion.durMed,
                delay: index * 0.05,
                ease: tokens.motion.ease,
              }}
              onMouseEnter={() => onHoverChange(skill.id)}
              onMouseLeave={() => onHoverChange(null)}
            >
              <SkillClusterView
                skill={skill}
                index={index}
                reducedMotion={reducedMotion}
                onSelect={onSelect}
                mode="map"
                isAnchor={pos.isAnchor}
                orbitPaused={hoveredId === skill.id}
              />
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
