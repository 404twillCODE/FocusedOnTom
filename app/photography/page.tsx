"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WorkInProgressBanner } from "@/components/WorkInProgressBanner";

export default function PhotographyPage() {
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
              Photography
            </h1>
            <p className="mt-3 max-w-xl text-[var(--textMuted)]">
              A selection of shots — portraits, street, and whatever catches the
              light. More coming soon.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
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
      </div>
    </main>
  );
}
