// Centralized workout types — single source of truth for the entire workout feature.

// ───────── Exercise categories ─────────

export type ExerciseCategory =
  | "legs"
  | "arms"
  | "chest"
  | "back"
  | "shoulders"
  | "core"
  | "cardio"
  | "full_body";

export const ALL_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "legs", label: "Legs" },
  { value: "arms", label: "Arms" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Full Body" },
];

// ───────── Set / Exercise (Workout tab state) ─────────

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number | null; // null = no weight (hidden)
  completed: boolean;
  breakTime?: number; // Rest/break in seconds per set (0 = off)
  rpe?: number | null; // 1-10 when RPE tracking enabled
  isDropSet?: boolean;
}

export interface Exercise {
  id: number;
  name: string;
  categories: ExerciseCategory[];
  sets?: WorkoutSet[];
  selectedDays?: number[]; // Days where this exercise appears
  notes?: string;
  completed?: boolean;
}

// ───────── Modal set row (Add/Edit Exercise) ─────────

export type SetRow = {
  reps: number | null;
  weight: number | null;
  restSec: number;
  rpe?: number | null;
  isDropSet?: boolean;
};

// ───────── History / Stats helpers ─────────

export type HistoryExercise = {
  name?: string;
  categories?: ExerciseCategory[];
  sets?: {
    reps?: number;
    weight?: number | null;
    completed?: boolean;
    setNumber?: number;
    breakTime?: number;
  }[];
};

/** Compute total volume for an array of exercises: sum(reps * weight) for sets that have weight. */
export function computeVolume(exercises: HistoryExercise[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const s of ex.sets ?? []) {
      if (s.weight != null && s.weight > 0) {
        total += (s.reps ?? 0) * s.weight;
      }
    }
  }
  return total;
}

/** Find the "best set" for an exercise (highest single-set volume, or highest reps if no weight). */
export function getBestSet(sets: HistoryExercise["sets"]): {
  reps: number;
  weight: number | null;
  volume: number;
} | null {
  if (!sets || sets.length === 0) return null;
  let best: { reps: number; weight: number | null; volume: number } | null = null;
  for (const s of sets) {
    const r = s.reps ?? 0;
    const w = s.weight ?? 0;
    const vol = w > 0 ? r * w : r; // use reps as tiebreaker for bodyweight
    if (!best || vol > best.volume) {
      best = { reps: r, weight: s.weight ?? null, volume: vol };
    }
  }
  return best;
}

/** Format a best-set as a readable string like "200 × 10" or "15 reps". */
export function formatBestSet(best: { reps: number; weight: number | null }): string {
  if (best.weight != null && best.weight > 0) {
    return `${best.weight} × ${best.reps}`;
  }
  return `${best.reps} reps`;
}
