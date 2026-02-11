"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Code2, Server, Car } from "lucide-react";
import { WorkInProgressBanner } from "@/components/WorkInProgressBanner";

const projects = [
  {
    title: "Nodexity",
    subtitle: "Minecraft server manager",
    description:
      "A tool to manage Minecraft servers — start, stop, monitor, and configure your server from one place. Built to make self-hosting simpler.",
    tags: ["Node.js", "Minecraft", "DevOps"],
    href: "#",
    repo: "#",
    icon: Server,
  },
  {
    title: "PullUp",
    subtitle: "Car meet app",
    description:
      "Find and join local car meets. See what's happening near you, share your ride, and connect with other enthusiasts.",
    tags: ["React", "Mobile", "Maps"],
    href: "#",
    repo: "#",
    icon: Car,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function DevPage() {
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  return (
    <main className="min-h-screen">
      <WorkInProgressBanner onDismiss={() => setNotificationDismissed(true)} />
      <div
        className={`transition-opacity duration-300 ${notificationDismissed ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <section className="mx-auto max-w-5xl px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl sm:text-4xl">
              Dev
            </h1>
            <p className="mt-3 max-w-xl text-[var(--textMuted)]">
              Things I've been building — side projects and experiments. Links and
              code when available.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((project, i) => (
            <AnimatedCard key={project.title} delay={0.08 * (i + 1)}>
              <motion.article
                className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 transition-colors hover:border-[var(--ice)]/25 hover:bg-[var(--iceSoft)]/20"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", bounce: 0.35 }}
              >
                <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <motion.span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)] transition-colors group-hover:bg-[var(--ice)]/25"
                      whileHover={{ scale: 1.06 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <project.icon className="h-5 w-5" />
                    </motion.span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                        {project.title}
                      </h2>
                      <p className="mt-0.5 text-sm text-[var(--ice)]">
                        {project.subtitle}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-[var(--textMuted)] leading-relaxed">
                    {project.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <motion.span
                        key={tag}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg3)]/80 px-2.5 py-1 text-xs text-[var(--textMuted)]"
                        whileHover={{
                          scale: 1.03,
                          borderColor: "rgba(125, 211, 252, 0.35)",
                          color: "var(--ice)",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.href && project.href !== "#" && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/50 hover:text-[var(--ice)]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Live
                      </a>
                    )}
                    {project.repo && project.repo !== "#" && (
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/50 hover:text-[var(--ice)]"
                      >
                        <Code2 className="h-4 w-4" />
                        Code
                      </a>
                    )}
                    {(!project.href || project.href === "#") &&
                      (!project.repo || project.repo === "#") && (
                      <span className="text-sm text-[var(--textMuted)]">
                        Links coming soon
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            </AnimatedCard>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
