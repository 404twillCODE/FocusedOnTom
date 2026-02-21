"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FOYBackground } from "./FOYBackground";
import { getOnboardingProgress } from "./FOYOnboardingConfig";

const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

export function FOYOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const progress = getOnboardingProgress(pathname);

  return (
    <div className="focusedonyou-no-zoom flex min-h-screen flex-col">
      <FOYBackground />
      <main className="flex flex-1 flex-col px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={transition}
          className="flex flex-1 flex-col"
        >
          {children}
        </motion.div>
      </main>
      {/* Progress bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-[var(--bg3)]">
        <motion.div
          className="h-full bg-[var(--ice)]"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={transition}
        />
      </div>
    </div>
  );
}
