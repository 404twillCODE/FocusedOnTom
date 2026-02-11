"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type Platform = "ios" | "android" | "other";

export function WorkoutInstallPrompt({
  open,
  platform,
  onDismiss,
}: {
  open: boolean;
  platform: Platform;
  onDismiss: () => void;
}) {
  if (!open) return null;

  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-4 sm:px-4"
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/95 p-4 shadow-xl backdrop-blur-md sm:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      Add Workout to your home screen
                    </p>
                    <p className="mt-1 text-xs text-[var(--textMuted)]">
                      Use it like a dedicated app with one tap.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="rounded-lg p-1.5 text-[var(--textMuted)] hover:bg-white/10 hover:text-[var(--text)]"
                    aria-label="Dismiss add to home screen hint"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 rounded-xl bg-[var(--bg3)]/80 p-3 text-xs text-[var(--textMuted)]">
                  {isIOS && (
                    <p>
                      On iOS Safari: tap the <span className="font-semibold">Share</span>{" "}
                      icon, then choose{" "}
                      <span className="font-semibold">“Add to Home Screen”</span>.
                    </p>
                  )}
                  {isAndroid && (
                    <p>
                      On Android: open the browser menu{" "}
                      <span className="font-semibold">⋮</span> and choose{" "}
                      <span className="font-semibold">“Add to Home screen”</span>.
                    </p>
                  )}
                  {!isIOS && !isAndroid && (
                    <p>
                      Use your browser&apos;s menu to add this page to your home screen
                      as an app shortcut.
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    onClick={onDismiss}
                    className="px-3 py-1.5 text-xs"
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

