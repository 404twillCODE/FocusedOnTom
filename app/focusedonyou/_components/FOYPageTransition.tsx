"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.35, ease },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease },
  },
};

export function FOYPageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
