"use client";

import { motion } from "framer-motion";
import { useAppStore, type AppState } from "@/store/appStore";

const DURATION = 0.7;
const DURATION_REDUCED = 0.25;
const EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];
const DRIFT_PX = 24;

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Cinematic page transition: enter = fade + upward drift, exit = fade + downward drift.
 * Respects reduced motion: fade only, shorter duration.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const duration = reducedMotion ? DURATION_REDUCED : DURATION;
  const drift = reducedMotion ? 0 : DRIFT_PX;

  return (
    <motion.div
      initial={{ opacity: 0, y: drift }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -drift }}
      transition={{
        duration,
        ease: EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
