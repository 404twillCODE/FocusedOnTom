"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { SkillCluster } from "@/lib/types/content";
import { tokens } from "@/tokens/tokens";
import { getStrengthLabel } from "@/lib/skills/strengthLabel";
import { getProjectBySlug } from "@/lib/data/projects";
import { ROUTES } from "@/lib/routes";

interface SkillDetailPanelProps {
  skill: SkillCluster | null;
  onClose: () => void;
  reducedMotion: boolean;
}

const FOCUSABLE = "button, [href], input, select, textarea";

function useFocusTrap(active: boolean, panelRef: React.RefObject<HTMLDivElement | null>) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const target = e.target as HTMLElement;
      if (e.shiftKey) {
        if (target === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (target === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [active, panelRef]
  );

  useEffect(() => {
    if (!active) return;
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [active, handleKeyDown]);
}

export function SkillDetailPanel({ skill, onClose, reducedMotion }: SkillDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(!!skill, panelRef);

  useEffect(() => {
    if (!skill) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [skill, onClose]);

  useEffect(() => {
    if (skill) {
      closeButtonRef.current?.focus();
    }
  }, [skill]);

  const strengthLabel = skill ? getStrengthLabel(skill.level) : "";
  const usedInProjects = skill
    ? (skill.usedIn ?? [])
        .map((slug) => ({ slug, project: getProjectBySlug(slug) }))
        .filter((p) => p.project)
    : [];

  return (
    <AnimatePresence>
      {skill && (
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
        aria-modal="true"
        role="dialog"
        aria-labelledby="skill-detail-title"
      >
        <div
          className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
          aria-hidden
        />
        <motion.div
          ref={panelRef}
          className="relative w-full max-w-lg"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: tokens.motion.durMed, ease: tokens.motion.ease }}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <GlassPanel
            variant="panel"
            glow="none"
            className={cn(
              "relative overflow-hidden border border-border/80 p-5 shadow-xl",
              "ring-1 ring-white/5"
            )}
          >
            {/* Subtle animated gradient sweep inside panel */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-[0.06]",
                reducedMotion ? "" : "animate-gradient-sweep"
              )}
              style={{
                background: `linear-gradient(105deg, transparent 0%, ${skill.color}22 40%, transparent 70%)`,
                backgroundSize: "200% 100%",
              }}
              aria-hidden
            />

            <div className="relative">
              {/* Header: name + category */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id="skill-detail-title"
                    className="text-xl font-semibold tracking-tight text-text"
                  >
                    {skill.label}
                  </h2>
                  {skill.category && (
                    <span
                      className="mt-1.5 inline-block rounded-md border border-border/80 bg-panel-solid/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-textMuted"
                    >
                      {skill.category}
                    </span>
                  )}
                </div>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-textMuted hover:bg-panel-solid hover:text-text"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Strength: meter + label + rings hint */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[120px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-textMuted">Level</span>
                    <span
                      className="font-mono text-xs font-medium"
                      style={{ color: skill.color }}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                  <div
                    className="mt-1 h-2 w-full rounded-full bg-panel-solid"
                    role="progressbar"
                    aria-valuenow={skill.level}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Strength ${skill.level}% — ${strengthLabel}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${skill.level}%`,
                        backgroundColor: skill.color,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-right font-mono text-[10px] text-textMuted">
                    {skill.level}%
                  </p>
                </div>
              </div>

              {/* Stats row: Years, Confidence */}
              {(skill.years != null || skill.confidence != null) && (
                <div className="mt-4 flex flex-wrap gap-6 border-y border-border/60 py-3">
                  {skill.years != null && (
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-textMuted">
                        Years
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-text">{skill.years}</p>
                    </div>
                  )}
                  {skill.confidence != null && (
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-textMuted">
                        Confidence
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-text">
                        {skill.confidence}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-3 text-sm text-textMuted leading-relaxed">
                {skill.summary}
              </p>

              {/* Tech pills */}
              {skill.tech.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-textMuted">
                    Tech
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tech.map((t) => (
                      <Tag
                        key={t}
                        className="border-border text-text"
                        style={{ borderColor: `${skill.color}40` }}
                      >
                        {t}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {skill.keywords?.length ? (
                <div className="mt-3">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-textMuted/80">
                    Keywords
                  </p>
                  <p className="text-xs text-textMuted/90">
                    {skill.keywords.join(" · ")}
                  </p>
                </div>
              ) : null}

              {/* Used in Projects */}
              {usedInProjects.length > 0 && (
                <div className="mt-5 border-t border-border/60 pt-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-textMuted">
                    Used in Projects
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {usedInProjects.map(({ slug, project }) => (
                      <li key={slug}>
                        <Link
                          href={ROUTES.project(slug)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border border-border/80 bg-panel-solid/80 px-2 py-1 text-xs text-text",
                            "hover:border-mint/40 hover:text-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                          )}
                        >
                          {project?.name ?? slug}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
