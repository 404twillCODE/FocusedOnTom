"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Instagram, X } from "lucide-react";
import { PHOTOGRAPHY_INSTAGRAM_URL } from "@/lib/social-links";

const STORAGE_PREFIX = "photography-ig-nudge:";
const NUDGE_DELAY_MS = 5000;

type PhotographyInstagramScrollNudgeProps = {
  /** Unique key so each gallery only nudges once per browser tab session. */
  storageKey: string;
};

export function PhotographyInstagramScrollNudge({
  storageKey,
}: PhotographyInstagramScrollNudgeProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fullKey = STORAGE_PREFIX + storageKey;
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(fullKey) === "1") return;
    } catch {
      return;
    }

    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(fullKey, "1");
      } catch {
        /* private mode */
      }
      setOpen(true);
    }, NUDGE_DELAY_MS);

    return () => window.clearTimeout(id);
  }, [storageKey]);

  const dismiss = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[160] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
          role="status"
        >
          <div className="pointer-events-auto relative flex max-w-md flex-col gap-3 rounded-2xl border border-white/12 bg-[rgba(10,16,28,0.94)] px-4 py-3.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4">
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismiss}
              className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-8 pt-0.5 sm:pr-0">
              <p className="text-sm font-medium leading-snug text-white/95 sm:text-[15px]">
                Liking these photos? Follow on Instagram for more.
              </p>
            </div>
            <a
              href={PHOTOGRAPHY_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--ice)]/45 bg-[var(--ice)]/12 px-4 py-2.5 text-sm font-semibold text-[var(--ice)] shadow-[0_0_0_1px_rgba(125,211,252,0.06)_inset] transition-colors hover:border-[var(--ice)]/65 hover:bg-[var(--ice)]/18 sm:py-2"
            >
              <Instagram className="h-4 w-4" aria-hidden />
              Follow on Instagram
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
