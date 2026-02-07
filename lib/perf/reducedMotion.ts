/**
 * Reduced motion preference.
 * Use in R3F and motion components to respect prefers-reduced-motion.
 */

export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotionSubscription(callback: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => callback(mq.matches);
  mq.addEventListener("change", handler);
  callback(mq.matches);
  return () => mq.removeEventListener("change", handler);
}
