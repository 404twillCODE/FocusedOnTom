"use client";

import { motion } from "framer-motion";
import { tokens } from "@/tokens/tokens";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: tokens.motion.durMed,
        ease: tokens.motion.ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
