"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Construction } from "lucide-react";

const DURATION_MS = 2500;

export function WorkInProgressBanner({ onDismiss }: { onDismiss?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-md"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-4 flex max-w-md items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl backdrop-blur-sm sm:px-8 sm:py-6"
          >
            <Construction className="mt-0.5 h-8 w-8 shrink-0 text-[var(--ice)] sm:h-9 sm:w-9" />
            <div>
              <p className="text-base font-medium text-white sm:text-lg">
                Work in progress
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                Some stuff might not work or things may not show up correctly.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
