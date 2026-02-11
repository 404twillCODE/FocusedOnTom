"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Camera, Code2, Sparkles, ArrowRight } from "lucide-react";
import { TypingEffect } from "@/components/TypingEffect";

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

const pillars = [
  {
    icon: Code2,
    title: "Development",
    text: "Web apps, tools, and side projects. I like clean code and thoughtful UX.",
  },
  {
    icon: Camera,
    title: "Photography",
    text: "Portraits, street, and moments that catch the light. Always learning.",
  },
  {
    icon: Sparkles,
    title: "Learning",
    text: "CS student — always picking up something new and applying it.",
  },
];

const exploreCards = [
  {
    href: "/dev",
    icon: Code2,
    title: "Dev & projects",
    text: "Side projects, tools, and experiments. Code and demos when available.",
    cta: "See projects",
    tags: [] as string[],
  },
  {
    href: "/photography",
    icon: Camera,
    title: "Photography",
    text: "Portraits, street, and moments that catch the light. A gallery of shots I'm proud of.",
    cta: "View gallery",
    tags: [] as string[],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
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
            Hi, I'm Tom
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

      {/* What I do */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <AnimatedSection delay={0}>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl sm:text-3xl">
            What I do
          </h2>
          <p className="mt-2 max-w-xl text-[var(--textMuted)] prose-custom">
            A bit of everything — dev, photography, and always learning.
          </p>
        </AnimatedSection>
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {pillars.map((pillar, i) => (
            <AnimatedSection key={pillar.title} delay={0.08 * (i + 1)} className="flex">
              <motion.li
                className="group flex w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 sm:p-7 transition-colors hover:border-[var(--ice)]/25 hover:bg-[var(--iceSoft)]/20"
                style={{ height: "280px" }}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", bounce: 0.35 }}
              >
                <motion.span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)] transition-colors group-hover:bg-[var(--ice)]/25"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  <pillar.icon className="h-5 w-5" />
                </motion.span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
                  {pillar.title}
                </h3>
                <p className="mt-2 flex-1 text-[var(--textMuted)] prose-custom">
                  {pillar.text}
                </p>
              </motion.li>
            </AnimatedSection>
          ))}
        </ul>
      </section>

      {/* Explore — same card style as What I do */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <AnimatedSection delay={0}>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl sm:text-3xl">
            Explore
          </h2>
          <p className="mt-2 max-w-xl text-[var(--textMuted)] prose-custom">
            Dive into what I've been building, or browse my photography.
          </p>
        </AnimatedSection>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {exploreCards.map((card, i) => (
            <AnimatedSection key={card.href} delay={0.08 * (i + 1)} className="flex">
              <Link href={card.href} className="group block w-full cursor-pointer">
                <motion.div
                  className="relative flex w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 transition-colors hover:border-[var(--ice)]/25 hover:bg-[var(--iceSoft)]/20 sm:p-7"
                  style={{ height: "280px" }}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", bounce: 0.35 }}
                >
                  <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--ice)] opacity-0 transition-opacity duration-200 group-hover:opacity-70" />
                  <motion.span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)] transition-colors group-hover:bg-[var(--ice)]/25"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    <card.icon className="h-5 w-5" />
                  </motion.span>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--text)] transition-colors group-hover:text-[var(--ice)]">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[var(--textMuted)] prose-custom">
                    {card.text}
                  </p>
                </motion.div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

    </main>
  );
}
