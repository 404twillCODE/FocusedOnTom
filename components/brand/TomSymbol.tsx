"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { tokens } from "@/tokens/tokens";

const WORDMARK = "FocusedOnTom";

/** Hexagon path (flat top), size ~50 viewBox units. */
const HEX_PATH =
  "M 50 0 L 93.3 25 L 93.3 75 L 50 100 L 6.7 75 L 6.7 25 Z";

interface TomSymbolProps {
  /** "slow" = first visit (~3s assembly), "fast" = return visit (~1.2s) */
  variant: "slow" | "fast";
  /** When true, run dissolve (opacity + scale out) */
  dissolve?: boolean;
  /** Called when assembly animation completes (before dissolve) */
  onAssemblyComplete?: () => void;
}

export function TomSymbol({
  variant,
  dissolve = false,
  onAssemblyComplete,
}: TomSymbolProps) {
  const isSlow = variant === "slow";
  const dotDelay = 0;
  const dotDur = isSlow ? 0.5 : 0.25;
  const hexDelay = dotDelay + dotDur + (isSlow ? 0.15 : 0.08);
  const hexDur = isSlow ? 0.6 : 0.35;
  const ringDelay = hexDelay + hexDur + (isSlow ? 0.1 : 0.05);
  const ringDur = isSlow ? 0.5 : 0.3;
  const wordmarkDelay = ringDelay + ringDur + (isSlow ? 0.12 : 0.06);
  const wordmarkDur = isSlow ? 0.6 : 0.4;

  const totalAssembly = wordmarkDelay + wordmarkDur;
  const assemblyDone = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!assemblyDone.current) {
        assemblyDone.current = true;
        onAssemblyComplete?.();
      }
    }, totalAssembly * 1000);
    return () => clearTimeout(t);
  }, [totalAssembly, onAssemblyComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Core dot → scale + glow pulse */}
      <motion.div
        className="absolute h-3 w-3 rounded-full bg-mint"
        style={{
          boxShadow: "0 0 20px var(--mint), 0 0 40px rgba(46, 242, 162, 0.35)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          opacity: 1,
        }}
        transition={{
          delay: dotDelay,
          duration: dotDur,
          ease: tokens.motion.ease,
        }}
      />
      {/* Glow pulse (repeating) */}
      <motion.div
        className="absolute h-6 w-6 rounded-full bg-mint/20"
        style={{ filter: "blur(8px)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 1.8],
          opacity: [0, 0.6, 0.3],
        }}
        transition={{
          delay: dotDelay,
          duration: dotDur,
          ease: tokens.motion.ease,
          repeat: Infinity,
          repeatDelay: 0.8,
        }}
      />

      {/* Hex outline — stroke draw */}
      <svg
        viewBox="0 0 100 100"
        className="absolute h-14 w-14 text-mint"
        style={{ overflow: "visible" }}
      >
        <motion.path
          d={HEX_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            delay: hexDelay,
            duration: hexDur,
            ease: tokens.motion.ease,
          }}
        />
      </svg>

      {/* Orbit ring — circular sweep */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute h-16 w-16 text-mint/80"
        style={{ overflow: "visible" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: ringDelay, duration: 0.15 }}
      >
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="283"
          strokeLinecap="round"
          initial={{ strokeDashoffset: 283 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{
            delay: ringDelay,
            duration: ringDur,
            ease: tokens.motion.ease,
          }}
        />
      </motion.svg>

      {/* Wordmark — fade + letter spacing */}
      <motion.div
        className="relative mt-20 flex overflow-hidden font-semibold tracking-tight text-mint"
        initial={{ opacity: 0, letterSpacing: "0.5em" }}
        animate={{
          opacity: 1,
          letterSpacing: "0.08em",
        }}
        transition={{
          delay: wordmarkDelay,
          duration: wordmarkDur,
          ease: tokens.motion.ease,
        }}
      >
        {WORDMARK.split("").map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: wordmarkDelay + (i / WORDMARK.length) * wordmarkDur * 0.6,
              duration: 0.12,
            }}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>

      {/* Dissolve overlay: scale down + fade when dissolve is true */}
      {dissolve && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.5,
            ease: tokens.motion.ease,
          }}
        />
      )}
    </div>
  );
}
