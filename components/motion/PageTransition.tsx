"use client";

import { motion } from "framer-motion";

const DURATION = 0.7;
const EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];
const DRIFT_PX = 24;

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Cinematic page transition: enter = fade + upward drift, exit = fade + downward drift.
 * ~700ms, cubic-bezier. Use with key={pathname} for route-based re-mount.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: DRIFT_PX }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -DRIFT_PX }}
      transition={{
        duration: DURATION,
        ease: EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
