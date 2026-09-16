"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FOYButtonLink } from "@/app/focusedonyou/_components";

export default function OnboardingEntryPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center">
      <motion.h1
        className="text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        Set up your workout
      </motion.h1>
      <motion.p
        className="mt-3 text-lg text-[var(--textMuted)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        A few quick choices so we can tailor the app to you.
      </motion.p>
      <motion.div
        className="mt-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <FOYButtonLink
          href="/focusedonyou/onboarding/goal"
          variant="primary"
          className="min-h-12 w-full text-base"
        >
          Get started
        </FOYButtonLink>
      </motion.div>
    </div>
  );
}
