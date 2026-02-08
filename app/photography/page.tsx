"use client";

import { motion } from "framer-motion";

export default function PhotographyPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
            Photography
          </h1>
          <p className="mt-3 max-w-xl text-[var(--textMuted)]">
            A selection of shots — portraits, street, and whatever catches the
            light. More coming soon.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 flex items-center justify-center text-[var(--textMuted)] text-sm"
            >
              Photo {i}
            </div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
