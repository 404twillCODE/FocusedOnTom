"use client";

import { motion } from "framer-motion";

export default function LifestylePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl sm:text-4xl">
            Lifestyle
          </h1>
          <p className="mt-3 max-w-xl text-[var(--textMuted)]">
            Beyond code and cameras. Coming soon.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
