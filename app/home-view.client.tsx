"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Camera, Code2, Sparkles, ArrowUpRight, ArrowRight } from "lucide-react";
import { TypingEffect } from "@/components/TypingEffect";
import { eventPageHref } from "@/lib/photography";
import type { RecentPhoto } from "@/lib/photography";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const typingPhrases = [
  "I build things for the web.",
  "I take photos that tell stories.",
  "I'm studying CS and making stuff.",
  "Code, cameras, and curiosity.",
];

type Destination = {
  href: string;
  index: string;
  kicker: string;
  icon: typeof Code2;
  title: string;
  description: string;
  tags: string[];
  cta: string;
};

const destinations: Destination[] = [
  {
    href: "/dev",
    index: "01",
    kicker: "Building",
    icon: Code2,
    title: "Development",
    description:
      "Side projects, tools, and small experiments on the web — shipped with clean code and thoughtful UX.",
    tags: ["Next.js", "TypeScript", "Node"],
    cta: "See projects",
  },
  {
    href: "/photography",
    index: "02",
    kicker: "Shooting",
    icon: Camera,
    title: "Photography",
    description:
      "Cars, landscapes, and the moments in between. A gallery of shots I'm proud of.",
    tags: ["Cars", "Landscape", "Street"],
    cta: "View gallery",
  },
  {
    href: "/skills",
    index: "03",
    kicker: "Studying",
    icon: Sparkles,
    title: "Learning",
    description:
      "The stacks, tools, and ideas I'm picking up as a CS student. Always something new in motion.",
    tags: ["CS", "Systems", "Design"],
    cta: "See what I'm into",
  },
];

const currently = [
  {
    label: "Shipping",
    detail: "Nodexity — a cleaner way to run Minecraft servers.",
  },
  {
    label: "Shooting",
    detail: "Portraits in low, golden-hour light.",
  },
  {
    label: "Studying",
    detail: "Data structures, systems, and a bit of design.",
  },
];

export function HomeView({ recentPhotos }: { recentPhotos: RecentPhoto[] }) {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6 sm:pt-28 sm:pb-24 md:pt-36 md:pb-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          <motion.p
            variants={item}
            className="text-sm font-medium tracking-wide text-[var(--ice)]"
          >
            Hi, I&apos;m Tom
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.75rem]"
          >
            Computer science student with a love for photography and building
            things.
          </motion.h1>
          <motion.div
            variants={item}
            className="mt-6 min-h-[2.2em] text-lg text-[var(--textMuted)] sm:text-xl"
          >
            <TypingEffect
              phrases={typingPhrases}
              className="text-[var(--ice)]"
              cursorClassName="bg-[var(--ice)]"
              speed={55}
              pauseAtEnd={2200}
            />
          </motion.div>
          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base text-[var(--textMuted)] prose-custom"
          >
            This is my corner of the web — a mix of code, cameras, and side
            projects. Easy to read, easy to explore.
          </motion.p>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pb-12 sm:px-6 sm:pb-16 md:grid-cols-2 md:gap-6">
        <AnimatedSection className="flex">
          <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 sm:p-8">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--ice)] opacity-[0.06] blur-3xl"
            />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
                <Camera className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                We capture
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              Moments with a little more intention.
            </h2>
            <p className="mt-3 text-[var(--textMuted)] prose-custom">
              Cars, portraits, landscapes, and the quiet details in between —
              shot with a clean, story-first feel.
            </p>
            <Link
              href="/photography"
              className="group mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--ice)]"
            >
              View photography
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.08} className="flex">
          <div className="flex w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/40 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                About me
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              I’m Tom, a CS student who builds and shoots.
            </h2>
            <p className="mt-3 text-[var(--textMuted)] prose-custom">
              I like making things that feel polished and useful, whether
              that’s a web app, a small tool, or a gallery full of photos from
              the latest thing I went out to capture.
            </p>
            <Link
              href="/skills"
              className="group mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--ice)]"
            >
              More about what I do
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </AnimatedSection>
      </section>

      <section
        id="explore"
        className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pb-20 sm:pt-8 md:pb-24"
      >
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
              What I do · Explore
            </span>
          </div>
          <div className="mt-5">
            <h2 className="max-w-xl text-2xl font-semibold leading-[1.15] tracking-tight text-[var(--text)] sm:text-3xl md:text-4xl">
              Code, cameras, and everything in between.
            </h2>
          </div>
        </AnimatedSection>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {destinations.map((card, i) => (
            <AnimatedSection
              key={card.href}
              delay={0.08 * (i + 1)}
              className="flex"
            >
              <motion.li
                whileHover={{ y: -6 }}
                transition={{ type: "spring", bounce: 0.35 }}
                className="group relative flex w-full"
              >
                <Link
                  href={card.href}
                  className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-6 transition-all duration-300 ease-out hover:border-[var(--ice)]/40 hover:bg-[var(--iceSoft)]/10 hover:shadow-[0_20px_60px_-30px_rgba(125,211,252,0.45)] sm:p-7"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--ice)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.08]"
                  />

                  <div className="flex items-start justify-between gap-3">
                    <motion.span
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)] ring-1 ring-inset ring-white/[0.04] transition-colors duration-300 group-hover:bg-[var(--ice)]/25"
                      whileHover={{ scale: 1.06 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                    >
                      <card.icon className="h-5 w-5" />
                    </motion.span>
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
                      <span className="font-mono text-[10px] text-[var(--ice)]/70">
                        {card.index}
                      </span>
                      <span className="h-px w-4 bg-[var(--border)]" aria-hidden />
                      <span>{card.kicker}</span>
                    </div>
                  </div>

                  <h3 className="mt-7 text-xl font-semibold tracking-tight text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--ice)] sm:text-2xl">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-[var(--textMuted)] prose-custom">
                    {card.description}
                  </p>

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-[var(--border)] bg-white/[0.02] px-2.5 py-1 text-xs text-[var(--textMuted)] transition-colors duration-300 group-hover:border-[var(--ice)]/25 group-hover:text-[var(--text)]"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <div className="flex-1" />

                  <div className="mt-8 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ice)]">
                      {card.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="h-4 w-4 text-[var(--textMuted)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--ice)]"
                    />
                  </div>
                </Link>
              </motion.li>
            </AnimatedSection>
          ))}
        </ul>
      </section>

      {recentPhotos.length >= 3 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                    Recent shots
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  From the camera, lately.
                </h3>
              </div>
              <Link
                href="/photography"
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--ice)]"
              >
                View gallery
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </AnimatedSection>

          <ul className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {recentPhotos.map((photo, i) => (
              <AnimatedSection
                key={photo.src}
                delay={0.06 * (i + 1)}
                className="flex"
              >
                <motion.li
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", bounce: 0.35 }}
                  className="group relative w-full"
                >
                  <Link
                    href={eventPageHref(photo.categorySlug, photo.eventSlug)}
                    className="relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg3)] transition-all duration-300 hover:border-[var(--ice)]/40 hover:shadow-[0_18px_50px_-30px_rgba(125,211,252,0.45)]"
                    aria-label={`${photo.eventTitle} — ${photo.categoryTitle}`}
                  >
                    <div className="relative aspect-[4/5] sm:aspect-[4/5]">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 640px) 33vw, 28vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
                        <div className="min-w-0">
                          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/70">
                            {photo.categoryTitle}
                          </div>
                          <div className="truncate text-sm font-medium text-white sm:text-[15px]">
                            {photo.eventTitle}
                          </div>
                        </div>
                        <ArrowUpRight
                          aria-hidden
                          className="h-4 w-4 shrink-0 text-white/80 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--ice)]"
                        />
                      </div>
                    </div>
                  </Link>
                </motion.li>
              </AnimatedSection>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        <AnimatedSection>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/40 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
              <div className="flex items-center gap-3 md:w-48 md:shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ice)] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ice)]" />
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                  Currently
                </span>
              </div>

              <ul className="grid flex-1 gap-4 sm:grid-cols-3 sm:gap-6">
                {currently.map((entry) => (
                  <li
                    key={entry.label}
                    className="flex flex-col gap-1 border-l border-[var(--border)] pl-4 sm:border-l sm:pl-5"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
                      {entry.label}
                    </span>
                    <span className="text-sm text-[var(--text)] sm:text-[15px]">
                      {entry.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </main>
  );
}
