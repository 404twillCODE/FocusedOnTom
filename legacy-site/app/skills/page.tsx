"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  learningNow,
  levelMeta,
  skillGroups,
  type SkillLevel,
} from "@/lib/skills";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FILTERS: { id: SkillLevel | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "daily", label: "Daily" },
  { id: "comfortable", label: "Comfortable" },
  { id: "learning", label: "Learning" },
  { id: "exploring", label: "Exploring" },
];

function LevelDots({ level }: { level: SkillLevel }) {
  const meta = levelMeta[level];
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      aria-label={`${meta.label} level`}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < meta.dots
              ? meta.tone === "ice"
                ? "bg-[var(--ice)]"
                : "bg-[var(--textMuted)]"
              : "bg-white/[0.08]"
          }`}
        />
      ))}
    </span>
  );
}

export default function SkillsPage() {
  const [filter, setFilter] = useState<SkillLevel | "all">("all");

  const totalCount = useMemo(
    () => skillGroups.reduce((acc, g) => acc + g.skills.length, 0),
    []
  );

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="mx-auto max-w-5xl px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-12">
        <AnimatedBlock>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
              Skills
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.75rem]">
            What I work with.
          </h1>
          <p className="mt-4 max-w-xl text-[var(--textMuted)] prose-custom">
            A running list of the languages, tools, and ideas I actually use —
            grouped by how deep I&apos;m in them right now.
          </p>
        </AnimatedBlock>
      </section>

      {/* Now spotlight */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 sm:pb-16">
        <AnimatedBlock delay={0.05}>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
              <div className="md:w-52 md:shrink-0">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ice)] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ice)]" />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                    Learning now
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--textMuted)]">
                  The stuff actively taking up brain space this semester.
                </p>
              </div>

              <ul className="grid flex-1 gap-5 sm:grid-cols-3 sm:gap-6">
                {learningNow.map((entry) => (
                  <li
                    key={entry.title}
                    className="flex flex-col gap-1 border-l border-[var(--border)] pl-4 sm:pl-5"
                  >
                    <span className="flex items-center gap-2 text-[var(--text)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--ice)]" />
                      <span className="text-sm font-medium sm:text-[15px]">
                        {entry.title}
                      </span>
                    </span>
                    <span className="text-sm text-[var(--textMuted)]">
                      {entry.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedBlock>
      </section>

      {/* Filter bar */}
      <section className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <AnimatedBlock delay={0.1}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--textMuted)]">
              {totalCount} things tracked
            </div>
            <div
              role="tablist"
              aria-label="Filter skills by level"
              className="flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg2)]/40 p-1"
            >
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                      active
                        ? "text-[var(--text)]"
                        : "text-[var(--textMuted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="skill-filter-pill"
                        className="absolute inset-0 rounded-full bg-white/[0.08]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </AnimatedBlock>
      </section>

      {/* Groups */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          {skillGroups.map((group, i) => {
            const filtered = group.skills.filter(
              (s) => filter === "all" || s.level === filter
            );
            if (filtered.length === 0) return null;
            return (
              <AnimatedBlock
                key={group.title}
                delay={0.05 * (i + 1)}
                className="flex"
              >
                <div className="flex w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 sm:p-7">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold text-[var(--text)] sm:text-xl">
                      {group.title}
                    </h2>
                    <span className="text-[11px] font-mono text-[var(--textMuted)]">
                      {filtered.length.toString().padStart(2, "0")}
                    </span>
                  </div>
                  {group.description && (
                    <p className="mt-1 text-sm text-[var(--textMuted)]">
                      {group.description}
                    </p>
                  )}

                  <ul className="mt-5 flex flex-col divide-y divide-[var(--border)]">
                    {filtered.map((skill) => {
                      const meta = levelMeta[skill.level];
                      return (
                        <li
                          key={skill.name}
                          className="flex items-center justify-between gap-4 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] text-[var(--text)]">
                              {skill.name}
                            </p>
                            {skill.note && (
                              <p className="mt-0.5 truncate text-xs text-[var(--textMuted)]">
                                {skill.note}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
                              {meta.label}
                            </span>
                            <LevelDots level={skill.level} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      </section>
    </main>
  );
}
