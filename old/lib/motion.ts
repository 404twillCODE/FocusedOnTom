export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeExpo = [0.16, 1, 0.3, 1] as const;
export const easeSoft = [0.33, 1, 0.68, 1] as const;
export const springSnappy = { type: "spring" as const, stiffness: 260, damping: 22 };
export const springSoft = { type: "spring" as const, stiffness: 140, damping: 18 };

export const staggerFast = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeExpo },
  },
};
