"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { formatRestTimer } from "./useRestTimer";

type Props = {
  visible: boolean;
  secondsLeft: number;
  onDismiss: () => void;
};

export function RestTimerSheet({ visible, secondsLeft, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onDismiss}
            aria-hidden
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg2)] p-4 pb-safe"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--textMuted)]">Rest</p>
              <button
                type="button"
                onClick={onDismiss}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--textMuted)] transition-colors duration-200 hover:bg-[var(--bg3)] hover:text-[var(--text)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg2)]"
                aria-label="Dismiss rest timer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-center text-4xl font-semibold tabular-nums text-[var(--ice)]">
              {formatRestTimer(secondsLeft)}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
