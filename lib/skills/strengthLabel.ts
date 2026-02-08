/**
 * Human-readable strength label from level (0–100).
 */
export function getStrengthLabel(level: number): string {
  if (level >= 90) return "Elite";
  if (level >= 75) return "Strong";
  if (level >= 60) return "Solid";
  return "Growing";
}
