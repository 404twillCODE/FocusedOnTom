"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Timer,
  ClipboardList,
} from "lucide-react";
import {
  FOYContainer,
  FOYCard,
  FOYSectionTitle,
  FOYButtonLink,
} from "@/app/focusedonyou/_components";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: TrendingUp,
    title: "Progress",
    description:
      "See your lifts and reps over time. No clutter, just the numbers that matter.",
  },
  {
    icon: Timer,
    title: "Rest Timer",
    description:
      "Simple countdown between sets. Start, stop, repeat. No fuss.",
  },
  {
    icon: ClipboardList,
    title: "Simple Logging",
    description:
      "Log sets and weights in seconds. Use what you want, ignore what you don't.",
  },
];

export default function FocusedOnYouLandingPage() {
  return (
    <FOYContainer>
      {/* Hero */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          <motion.h1
            variants={item}
            className="text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl"
          >
            FocusedOnYou
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-4 text-lg text-[var(--textMuted)] sm:text-xl prose-custom"
          >
            Stupid simple workouts. Use what you want, ignore what you don't.
          </motion.p>
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap gap-3"
          >
            <FOYButtonLink
              href="/focusedonyou/get-started"
              variant="primary"
              className="min-h-12 px-6 text-base"
            >
              Get Started
            </FOYButtonLink>
            <FOYButtonLink
              href="/focusedonyou/preview"
              variant="secondary"
              className="min-h-12 px-6 text-base"
            >
              Preview
            </FOYButtonLink>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="pb-20 sm:pb-24 md:pb-28">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <FOYSectionTitle className="sr-only">Features</FOYSectionTitle>
          <ul className="grid gap-6 sm:grid-cols-3">
            {features.map((feature, i) => (
              <motion.li key={feature.title} variants={item}>
                <Link href="/focusedonyou/get-started" className="block h-full">
                  <motion.div
                    className="h-full"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <FOYCard className="group flex h-full flex-col">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)] transition-colors group-hover:bg-[var(--ice)]/25"
                        aria-hidden
                      >
                        <feature.icon className="h-5 w-5" />
                      </span>
                      <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">
                        {feature.title}
                      </h2>
                      <p className="mt-2 flex-1 text-[var(--textMuted)] prose-custom">
                        {feature.description}
                      </p>
                    </FOYCard>
                  </motion.div>
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>
    </FOYContainer>
  );
}
