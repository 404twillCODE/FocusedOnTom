"use client";

import { motion } from "framer-motion";
import { tokens } from "@/tokens/tokens";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: tokens.motion.durMed,
        ease: tokens.motion.ease,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
