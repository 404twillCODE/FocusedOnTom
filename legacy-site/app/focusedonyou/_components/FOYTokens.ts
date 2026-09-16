/**
 * Design tokens for FocusedOnYou. Matches main FocusedOnTom site.
 * Use for consistent typography, spacing, motion.
 */
export const FOY_MOTION = {
  durationFast: 0.2,
  durationMed: 0.3,
  durationSlow: 0.4,
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

export const FOY_TRANSITION = {
  default: { duration: FOY_MOTION.durationMed, ease: FOY_MOTION.ease },
  fast: { duration: FOY_MOTION.durationFast, ease: FOY_MOTION.ease },
  slow: { duration: FOY_MOTION.durationSlow, ease: FOY_MOTION.ease },
} as const;
