"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TypingEffectProps = {
  phrases: string[];
  className?: string;
  cursorClassName?: string;
  speed?: number;
  pauseAtEnd?: number;
};

export function TypingEffect({
  phrases,
  className = "",
  cursorClassName = "bg-[var(--ice)]",
  speed = 60,
  pauseAtEnd = 1800,
}: TypingEffectProps) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPhrase = phrases[index];

  useEffect(() => {
    if (isPaused) {
      const pause = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseAtEnd);
      return () => clearTimeout(pause);
    }

    if (isDeleting) {
      if (subIndex === 0) {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
        return;
      }
      const timeout = setTimeout(() => setSubIndex((s) => s - 1), speed / 2);
      return () => clearTimeout(timeout);
    }

    if (subIndex < currentPhrase.length) {
      const timeout = setTimeout(() => setSubIndex((s) => s + 1), speed);
      return () => clearTimeout(timeout);
    }

    setIsPaused(true);
  }, [subIndex, isDeleting, isPaused, index, currentPhrase, phrases.length, speed, pauseAtEnd]);

  return (
    <span className={className}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="inline"
        >
          {currentPhrase.slice(0, subIndex)}
        </motion.span>
      </AnimatePresence>
      <motion.span
        className={`ml-0.5 inline-block h-[1.1em] w-[2px] align-middle ${cursorClassName}`}
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        aria-hidden
      />
    </span>
  );
}
