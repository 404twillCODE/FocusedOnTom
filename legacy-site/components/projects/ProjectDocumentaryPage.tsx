"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { AppShell } from "@/components/shell/AppShell";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useAppStore, type AppState } from "@/store/appStore";
import { tokens } from "@/tokens/tokens";
import { ProjectMeta } from "./ProjectMeta";
import { ProjectGallery } from "./ProjectGallery";
import { ProjectNav } from "./ProjectNav";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { Project, ProjectStatus } from "@/lib/types/content";

const STATUS_CLASS: Record<ProjectStatus, string> = {
  Live: "bg-mint/20 text-mint border-mint/40",
  Building: "bg-ice/20 text-ice border-ice/40",
  Archived: "bg-textMuted/20 text-textMuted border-border",
  Concept: "bg-purple/20 text-purple border-purple/40",
};

interface ProjectDocumentaryPageProps {
  project: Project;
  prev: Project | null;
  next: Project | null;
}

function SectionReveal({
  children,
  className,
  reducedMotion,
}: {
  children: React.ReactNode;
  className?: string;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: reducedMotion ? 0.15 : 0.5,
        ease: tokens.motion.ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ProjectDocumentaryPage({ project, prev, next }: ProjectDocumentaryPageProps) {
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Back link */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: tokens.motion.durFast }}
        >
          <Button variant="ghost" size="sm" className="text-textMuted" asChild>
            <Link href={ROUTES.projects}>← Projects</Link>
          </Button>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
          <div className="min-w-0">
            {/* Hero */}
            <header className="mt-6 lg:mt-8">
              <motion.h1
                className="text-4xl font-semibold tracking-tight text-text md:text-5xl lg:text-6xl"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0.2 : 0.6,
                  ease: tokens.motion.ease,
                }}
              >
                {project.name}
              </motion.h1>
              <motion.p
                className="mt-3 text-lg text-textMuted md:text-xl"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0.2 : 0.5,
                  delay: reducedMotion ? 0 : 0.1,
                  ease: tokens.motion.ease,
                }}
              >
                {project.tagline}
              </motion.p>
              <motion.div
                className="mt-4 flex flex-wrap items-center gap-3"
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reducedMotion ? 0 : 0.2, duration: tokens.motion.durMed }}
              >
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase",
                    STATUS_CLASS[project.status]
                  )}
                >
                  {project.status}
                </span>
                {project.tech.map((t) => (
                  <Tag key={t} className="bg-panel-solid/80 text-text border-border">
                    {t}
                  </Tag>
                ))}
              </motion.div>
              {project.links && project.links.length > 0 && (
                <motion.div
                  className="mt-5 flex flex-wrap gap-2"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.25, duration: tokens.motion.durMed }}
                >
                  {project.links.map((link) => (
                    <Button
                      key={link.label}
                      variant="outline"
                      size="sm"
                      className="border-border bg-panel-solid text-text hover:bg-panel"
                      asChild
                    >
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    </Button>
                  ))}
                </motion.div>
              )}
            </header>

            {/* Overview */}
            <SectionReveal className="mt-12" reducedMotion={reducedMotion}>
              <Heading as="h2" className="text-2xl md:text-3xl">
                Overview
              </Heading>
              <p className="mt-3 max-w-3xl text-textMuted leading-relaxed">
                {project.overview}
              </p>
            </SectionReveal>

            {/* Problem → Solution */}
            <SectionReveal className="mt-12" reducedMotion={reducedMotion}>
              <Heading as="h2" className="text-2xl md:text-3xl">
                Problem → Solution
              </Heading>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <GlassPanel variant="panel" glow="none" className="border border-border/60 p-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-mint">Problem</h3>
                  <p className="mt-2 text-sm text-textMuted leading-relaxed">{project.problem}</p>
                </GlassPanel>
                <GlassPanel variant="panel" glow="none" className="border border-border/60 p-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-ice">Solution</h3>
                  <p className="mt-2 text-sm text-textMuted leading-relaxed">{project.solution}</p>
                </GlassPanel>
              </div>
            </SectionReveal>

            {/* Highlights */}
            <SectionReveal className="mt-12" reducedMotion={reducedMotion}>
              <Heading as="h2" className="text-2xl md:text-3xl">
                Highlights
              </Heading>
              <ul className="mt-4 space-y-2">
                {(project.highlights ?? []).map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex gap-3 text-textMuted"
                    initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                    whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: tokens.motion.durMed,
                      delay: reducedMotion ? 0 : i * 0.05,
                      ease: tokens.motion.ease,
                    }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint/60" />
                    <span className="leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </SectionReveal>

            {/* Stack Breakdown */}
            {project.stackDetails && project.stackDetails.length > 0 && (
              <SectionReveal className="mt-12" reducedMotion={reducedMotion}>
                <Heading as="h2" className="text-2xl md:text-3xl">
                  Stack Breakdown
                </Heading>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {project.stackDetails.map((s, i) => (
                    <li key={i}>
                      <GlassPanel variant="panel" glow="none" className="border border-border/60 p-3">
                        <p className="font-medium text-text">{s.name}</p>
                        <p className="mt-1 text-xs text-textMuted">{s.notes}</p>
                      </GlassPanel>
                    </li>
                  ))}
                </ul>
              </SectionReveal>
            )}

            {/* Gallery */}
            {project.gallery && project.gallery.length > 0 && (
              <SectionReveal className="mt-12" reducedMotion={reducedMotion}>
                <Heading as="h2" className="text-2xl md:text-3xl">
                  Gallery
                </Heading>
                <ProjectGallery items={project.gallery} className="mt-4" />
              </SectionReveal>
            )}

            {/* Roadmap */}
            {project.roadmap && project.roadmap.length > 0 && (
              <SectionReveal className="mt-12" reducedMotion={reducedMotion}>
                <Heading as="h2" className="text-2xl md:text-3xl">
                  Roadmap
                </Heading>
                <ul className="mt-4 space-y-2">
                  {project.roadmap.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-panel/40 px-3 py-2"
                      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{
                        duration: tokens.motion.durMed,
                        delay: reducedMotion ? 0 : i * 0.04,
                        ease: tokens.motion.ease,
                      }}
                    >
                      <span className="font-mono text-mint" aria-hidden>→</span>
                      <span className="text-sm text-textMuted">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </SectionReveal>
            )}

            {/* Bottom Nav */}
            <SectionReveal className="mt-14" reducedMotion={reducedMotion}>
              <ProjectNav prev={prev} next={next} />
            </SectionReveal>
          </div>

          {/* Sidebar - desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ProjectMeta project={project} />
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
