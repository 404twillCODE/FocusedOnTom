"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { tokens } from "@/tokens/tokens";
import { TomSymbol } from "@/components/brand/TomSymbol";

const LINES = [
  "Initializing TomOS…",
  "Loading Creative Modules…",
  "Establishing System Focus…",
] as const;

const LINE_STAGGER_MS = 300;
const LINE_FADE_DUR = 0.3;

/** First visit: ~6s total. Boot text → hold → symbol (slow) → hold → dissolve → overlay fade. */
const FIRST_VISIT = {
  showBootText: true,
  bootHoldAfterMs: 900,
  symbolVariant: "slow" as const,
  symbolHoldAfterMs: 400,
  dissolveMs: 550,
  overlayFadeMs: 500,
};

/** Return visit: ~2s. No boot text, symbol (fast) → hold → dissolve → overlay fade. */
const RETURN_VISIT = {
  showBootText: false,
  bootHoldAfterMs: 0,
  symbolVariant: "fast" as const,
  symbolHoldAfterMs: 300,
  dissolveMs: 450,
  overlayFadeMs: 450,
};

interface BootSequenceProps {
  isReturnVisit: boolean;
  reducedMotion?: boolean;
  onComplete: () => void;
}

export function BootSequence({
  isReturnVisit,
  reducedMotion = false,
  onComplete,
}: BootSequenceProps) {
  const config = isReturnVisit ? RETURN_VISIT : FIRST_VISIT;
  const [visibleLines, setVisibleLines] = useState(0);
  const [showSymbol, setShowSymbol] = useState(config.showBootText ? false : true);
  const [dissolve, setDissolve] = useState(false);
  const [overlayFade, setOverlayFade] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Lock scroll while boot is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Clear timers on unmount to avoid layout jank or state updates after unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  if (reducedMotion) {
    return (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-bg"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: tokens.motion.ease }}
        onAnimationComplete={onComplete}
      />
    );
  }

  // Timeline: boot text (first visit only) → symbol → dissolve → overlay fade → onComplete
  useEffect(() => {
    if (config.showBootText) {
      addTimer(() => setVisibleLines(1), 0);
      addTimer(() => setVisibleLines(2), LINE_STAGGER_MS);
      addTimer(() => setVisibleLines(3), LINE_STAGGER_MS * 2);
      const symbolStart =
        LINE_STAGGER_MS * 2 + LINE_STAGGER_MS + config.bootHoldAfterMs;
      addTimer(() => setShowSymbol(true), symbolStart);
    }

    const symbolStartMs = config.showBootText
      ? LINE_STAGGER_MS * 3 + config.bootHoldAfterMs
      : 0;

    // Symbol assembly duration: slow ~2.8s, fast ~1.3s
    const symbolAssemblyMs = config.symbolVariant === "slow" ? 2800 : 1300;
    const dissolveStart = symbolStartMs + symbolAssemblyMs + config.symbolHoldAfterMs;
    addTimer(() => setDissolve(true), dissolveStart);

    const overlayFadeStart = dissolveStart + config.dissolveMs;
    addTimer(() => setOverlayFade(true), overlayFadeStart);

    const completeAt = overlayFadeStart + config.overlayFadeMs;
    addTimer(onComplete, completeAt);
  }, [config.showBootText, config.bootHoldAfterMs, config.symbolVariant, config.symbolHoldAfterMs, config.dissolveMs, config.overlayFadeMs, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
      initial={false}
      animate={{ opacity: overlayFade ? 0 : 1 }}
      transition={{
        duration: config.overlayFadeMs / 1000,
        ease: tokens.motion.ease,
      }}
      style={{
        pointerEvents: overlayFade ? "none" : "auto",
      }}
    >
      {/* Step 1 — Boot text (first visit only) */}
      {config.showBootText && (
        <div className="flex flex-col gap-3 font-mono text-sm text-textMuted">
          {LINES.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: visibleLines > i ? 1 : 0,
                y: visibleLines > i ? 0 : 6,
              }}
              transition={{
                duration: LINE_FADE_DUR,
                ease: tokens.motion.ease,
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>
      )}

      {/* Step 2 — Symbol assembly */}
      {showSymbol && (
        <div className="mt-12 sm:mt-16">
          <TomSymbol
            variant={config.symbolVariant}
            dissolve={dissolve}
          />
        </div>
      )}

      {/* Spacer when boot text skipped (return visit) so symbol is centered */}
      {!config.showBootText && !showSymbol && <div className="min-h-[200px]" />}
    </motion.div>
  );
}
