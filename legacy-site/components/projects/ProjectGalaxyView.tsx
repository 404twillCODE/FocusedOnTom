"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/lib/routes";
import { useAppStore, type AppState } from "@/store/appStore";
import { getNodePositions, getEdges, type NodePosition, type Edge } from "@/lib/projects/galaxyLayout";
import { ProjectNode } from "./ProjectNode";
import type { Project } from "@/lib/types/content";
import { tokens } from "@/tokens/tokens";

interface ProjectGalaxyViewProps {
  projects: Project[];
}

const ZOOM_DURATION_MS = 600;

export function ProjectGalaxyView({ projects }: ProjectGalaxyViewProps) {
  const router = useRouter();
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const [zoomingSlug, setZoomingSlug] = useState<string | null>(null);

  const positions = useMemo(() => getNodePositions(projects), [projects]);
  const edges = useMemo(() => getEdges(projects), [projects]);
  const positionMap = useMemo(
    () => new Map(positions.map((n) => [n.slug, n])),
    [positions]
  );

  const handleNodeClick = useCallback(
    (slug: string) => {
      if (zoomingSlug) return;
      setZoomingSlug(slug);
      const duration = reducedMotion ? 0.2 : ZOOM_DURATION_MS / 1000;
      setTimeout(() => {
        router.push(ROUTES.project(slug));
      }, duration * 1000);
    },
    [zoomingSlug, reducedMotion, router]
  );

  return (
    <div className="relative min-h-[420px] w-full overflow-hidden rounded-xl border border-border/60 bg-panel/30">
      <GalaxyCanvas
        positions={positions}
        edges={edges}
        positionMap={positionMap}
        projects={projects}
        zoomingSlug={zoomingSlug}
        reducedMotion={reducedMotion}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}

/** Inner canvas that has ref to measure and draw lines in pixel space. */
function GalaxyCanvas({
  positions,
  edges,
  positionMap,
  projects,
  zoomingSlug,
  reducedMotion,
  onNodeClick,
}: {
  positions: NodePosition[];
  edges: Edge[];
  positionMap: Map<string, NodePosition>;
  projects: Project[];
  zoomingSlug: string | null;
  reducedMotion: boolean;
  onNodeClick: (slug: string) => void;
}) {
  const [size, setSize] = useState({ w: 400, h: 420 });

  const setRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]?.contentRect ?? { width: 400, height: 420 };
      setSize({ w: Math.round(w), h: Math.round(h) });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={setRef} className="absolute inset-0">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="galaxyLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--ice)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <g>
          {edges.map(({ from, to }) => {
            const fromPos = positionMap.get(from);
            const toPos = positionMap.get(to);
            if (!fromPos || !toPos) return null;
            const x1 = fromPos.x * size.w;
            const y1 = fromPos.y * size.h;
            const x2 = toPos.x * size.w;
            const y2 = toPos.y * size.h;
            return (
              <line
                key={`${from}-${to}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#galaxyLineGrad)"
                strokeWidth="1"
              />
            );
          })}
        </g>
      </svg>
      {positions.map((pos) => {
        const project = projects.find((p) => p.slug === pos.slug);
        if (!project) return null;
        return (
          <div
            key={pos.slug}
            data-galaxy-node={pos.slug}
            className="absolute inset-0"
          >
            <ProjectNode
              project={project}
              x={pos.x}
              y={pos.y}
              reducedMotion={reducedMotion}
              isZooming={zoomingSlug === pos.slug}
              onClick={() => onNodeClick(pos.slug)}
            />
          </div>
        );
      })}
      <AnimatePresence>
        {zoomingSlug && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bg/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0.15 : ZOOM_DURATION_MS / 1000,
              ease: tokens.motion.ease,
            }}
          >
            <span className="font-mono text-sm text-mint">Opening...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
