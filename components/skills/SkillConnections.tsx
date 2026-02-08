"use client";

import { useRef, useEffect, useState } from "react";
import type { ClusterPosition } from "@/lib/skills/constellationLayout";
import type { SkillEdge } from "@/lib/data/skills";

interface SkillConnectionsProps {
  positions: ClusterPosition[];
  edges: SkillEdge[];
  hoveredId: string | null;
  className?: string;
}

export function SkillConnections({
  positions,
  edges,
  hoveredId,
  className,
}: SkillConnectionsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]?.contentRect ?? { width: 800, height: 500 };
      setSize({ w: Math.round(w), h: Math.round(h) });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const posMap = new Map(positions.map((p) => [p.id, p]));

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 h-full w-full pointer-events-none ${className ?? ""}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="skillLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--ice)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <g>
        {edges.map(({ from, to, type }) => {
          const a = posMap.get(from);
          const b = posMap.get(to);
          if (!a || !b) return null;
          const x1 = a.centerX * size.w;
          const y1 = a.centerY * size.h;
          const x2 = b.centerX * size.w;
          const y2 = b.centerY * size.h;
          const highlighted = hoveredId === from || hoveredId === to;
          const isOrbit = type === "orbit";
          const strokeWidth = isOrbit ? 1.5 : 1;
          const baseOpacity = isOrbit ? 0.35 : 0.12;
          const hoverOpacity = highlighted ? 0.55 : baseOpacity;
          return (
            <line
              key={`${from}-${to}-${type}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#skillLineGrad)"
              strokeWidth={strokeWidth}
              strokeOpacity={hoverOpacity}
              className="transition-[stroke-opacity] duration-200"
            />
          );
        })}
      </g>
    </svg>
  );
}
