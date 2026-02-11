"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WorkInProgressBanner } from "@/components/WorkInProgressBanner";

export default function SkillsPage() {
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
              Skills
            </h1>
            <p className="mt-3 max-w-xl text-[var(--textMuted)]">
              What I work with — languages, tools, and areas I'm building in. Coming soon.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
