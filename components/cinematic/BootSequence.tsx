"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "@/tokens/tokens";

const LINES = [
  "Initializing TomOS…",
  "Loading Creative Modules…",
  "Establishing System Focus…",
] as const;

const FIRST_VISIT = {
  lineDelayMs: 2000,
  symbolPhaseMs: 450,
  fadeOutMs: 500,
};
const RETURN_VISIT = {
  lineDelayMs: 600,
  symbolPhaseMs: 200,
  fadeOutMs: 400,
};

interface BootSequenceProps {
  isReturnVisit: boolean;
  reducedMotion?: boolean;
  onComplete: () => void;
}

export function BootSequence({ isReturnVisit, reducedMotion = false, onComplete }: BootSequenceProps) {
  const config = isReturnVisit ? RETURN_VISIT : FIRST_VISIT;
  const [visibleLines, setVisibleLines] = useState(0);
  const [symbolPhase, setSymbolPhase] = useState<0 | 1 | 2 | 3>(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const t1 = setTimeout(() => setVisibleLines(1), 0);
    const t2 = setTimeout(() => setVisibleLines(2), config.lineDelayMs);
    const t3 = setTimeout(() => setVisibleLines(3), config.lineDelayMs * 2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [config.lineDelayMs, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const linesDone = config.lineDelayMs * 3;
    const t4 = setTimeout(() => setSymbolPhase(1), linesDone);
    const t5 = setTimeout(() => setSymbolPhase(2), linesDone + config.symbolPhaseMs);
    const t6 = setTimeout(() => setSymbolPhase(3), linesDone + config.symbolPhaseMs * 2);
    const t7 = setTimeout(
      () => setFadeOut(true),
      linesDone + config.symbolPhaseMs * 3
    );
    const t8 = setTimeout(
      onComplete,
      linesDone + config.symbolPhaseMs * 3 + config.fadeOutMs
    );
    return () => {
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
    };
  }, [config.lineDelayMs, config.symbolPhaseMs, config.fadeOutMs, onComplete, reducedMotion]);

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

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
      initial={false}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{
        duration: config.fadeOutMs / 1000,
        ease: tokens.motion.ease,
      }}
      style={{ pointerEvents: fadeOut ? "none" : "auto" }}
    >
      <div className="flex flex-col gap-3 font-mono text-sm text-textMuted">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: visibleLines > i ? 1 : 0,
              y: visibleLines > i ? 0 : 4,
            }}
            transition={{
              duration: 0.3,
              ease: tokens.motion.ease,
            }}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <div className="mt-12 flex h-24 w-24 items-center justify-center">
        <AnimatePresence mode="wait">
          {symbolPhase === 0 && (
            <motion.div
              key="dot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: tokens.motion.ease }}
              className="h-2 w-2 rounded-full bg-mint"
            />
          )}
          {symbolPhase === 1 && (
            <motion.div
              key="hex"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: tokens.motion.ease }}
              className="h-12 w-12 border border-mint"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            />
          )}
          {symbolPhase === 2 && (
            <motion.div
              key="ring"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: tokens.motion.ease }}
              className="h-14 w-14 rounded-full border border-mint/80"
              style={{ borderStyle: "dashed" }}
            />
          )}
          {symbolPhase === 3 && (
            <motion.span
              key="wordmark"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: tokens.motion.ease }}
              className="font-semibold tracking-tight text-mint"
            >
              FocusedOnTom
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
