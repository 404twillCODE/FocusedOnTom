"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { easeExpo } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
  scale = false,
}: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduce
          ? false
          : {
              opacity: 0,
              y,
              scale: scale ? 0.97 : 1,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true, margin: "0px 0px -10% 0px", amount: 0.15 }}
      transition={{
        duration: 0.8,
        delay,
        ease: easeExpo,
      }}
    >
      {children}
    </motion.div>
  );
}
