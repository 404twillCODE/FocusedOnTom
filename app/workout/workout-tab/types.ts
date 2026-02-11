// Local UI types for the Workout tab (session editing, etc.)

export type LocalSet = {
  id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  is_done: boolean;
  is_drop_set: boolean;
  drop_set_level: number | null;
  rpe: number | null;
};

export type LocalExercise = {
  id: string;
  name: string;
  sets: LocalSet[];
};

export const DEFAULT_DROP_PERCENT = 15;
