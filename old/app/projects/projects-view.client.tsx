"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Car,
  Code2,
  Construction,
  ExternalLink,
  Globe,
  Server,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageHero } from "@/components/PageHero";

const projects = [
  {
    title: "Nodexity",
    subtitle: "Minecraft server manager",
    description:
      "A tool to manage Minecraft servers — start, stop, monitor, and configure your server from one place. Built to make self-hosting simpler.",
    tags: ["Node.js", "Minecraft", "DevOps"],
    href: "https://nodexity.com",
    repo: null as string | null,
    icon: Server,
    workInProgress: false,
  },
  {
    title: "PullUp",
    subtitle: "Car meet app",
    description:
      "Find and join local car meets. See what's happening near you, share your ride, and connect with other enthusiasts.",
    tags: ["React", "Mobile", "Maps"],
    href: null as string | null,
    repo: null as string | null,
    icon: Car,
    workInProgress: true,
  },
];

export function ProjectsView() {
  return (
    <>
      <PageHero
        eyebrow="DEV"
        title="Things I've"
        accent="been building."
        description="Side projects and experiments. Links when they're ready."
      />

      <section className="pb-16">
        <div className="container-page grid max-w-5xl gap-6 sm:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.title} delay={0.08 * (i + 1)}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg3)]/40 transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/10"
              >
                <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent-light)] transition-colors group-hover:border-[var(--accent)]/50">
                        <project.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                          {project.title}
                        </h2>
                        <p className="mt-0.5 text-sm text-[var(--accent-light)]">
                          {project.subtitle}
                        </p>
                      </div>
                    </div>
                    {project.workInProgress && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <Construction className="h-3 w-3" />
                        Work in progress
                      </span>
                    )}
                  </div>

                  <p className="mt-4 leading-relaxed text-[var(--text-muted)]">
                    {project.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.href ? (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-light)]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visit
                      </a>
                    ) : null}
                    {project.repo ? (
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-light)]"
                      >
                        <Code2 className="h-4 w-4" />
                        Code
                      </a>
                    ) : null}
                    {!project.href && !project.repo ? (
                      <span className="text-sm text-[var(--text-muted)]">
                        Links coming soon
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pb-28">
        <div className="container-page max-w-5xl">
          <Reveal>
            <Link
              href="/websites"
              className="group flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--bg3)]/40 px-6 py-6 transition-all hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]/10 sm:flex-row sm:items-center sm:px-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent-light)]">
                  <Globe className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">
                    Custom websites
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Starter, business, and custom packages — including client
                    work like Here Comes The Bride and Asphalt Solutions.
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium tracking-[0.18em] text-[var(--accent-light)]">
                VIEW WEBSITES →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
