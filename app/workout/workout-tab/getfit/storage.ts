// GetFit-style workout storage (per-user, scoped to Workout tab)
// Uses a single localStorage key per user so data is isolated.

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type DeficitEntry = {
  date: string;
  nutrition?: { calories: number; fat: number; carbs: number; protein: number };
  fitness?: { totalCalories: number };
  caloriesEaten: number;
  caloriesBurned: number;
  deficit: number;
};

export type WorkoutHistoryEntry = {
  date: string;
  timestamp: number;
  dayOfWeek: number;
  workoutType?: string;
  exercises: unknown[];
};

export type WeightEntry = {
  date: string;
  weight: number;
  timestamp: number;
};

export type TrackingStyle = "scheduled" | "inconsistent";

export type AppData = {
  deficitEntries: DeficitEntry[];
  savedWorkouts: unknown[][];
  workoutHistory: WorkoutHistoryEntry[];
  workoutSchedule: string[];
  weightHistory: WeightEntry[];
  workoutSetupComplete?: boolean;
  /** How the user plans to work out. Default scheduled. */
  trackingStyle?: TrackingStyle;
  /** For inconsistent: target workouts per week (1–7). */
  weeklyGoal?: number;
  /** For inconsistent: ordered list of workout type names, e.g. ["Push","Pull","Legs"]. */
  rotationOrder?: string[];
  /** User's preferred rest/break time in seconds (0 = timer off). Default 0. */
  preferred_rest_sec?: number;
};

/** Start of current week (Monday 00:00:00 local time). */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Count distinct workout dates in the same week as the given date (local). */
export function getWorkoutsCompletedThisWeek(
  history: WorkoutHistoryEntry[],
  asOf: Date = new Date()
): number {
  const start = getStartOfWeek(asOf);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const seen = new Set<string>();
  for (const entry of history) {
    const entryDate = new Date(entry.date + "T12:00:00");
    if (entryDate >= start && entryDate < end) seen.add(entry.date);
  }
  return seen.size;
}

const STORAGE_PREFIX = "workout_getfit_";

/** Strip non-printable and fix common UTF-8 mojibake so labels render cleanly. */
export function sanitizeExerciseDisplayText(s: unknown): string {
  if (s == null) return "";
  const str = typeof s === "string" ? s : String(s);
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  const mapped = cleaned
    .replace(/\u00C3\u0097/g, "x")
    .replace(/\u00C3\u00B7/g, "/")
    .replace(/\u00E2\u009C\u0093/g, "")
    .replace(/\u00E2\u009C\u0094/g, "");
  return mapped || "";
}

const safeJsonParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getDefaultData = (): AppData => ({
  deficitEntries: [],
  savedWorkouts: Array.from({ length: 7 }, () => []),
  workoutHistory: [],
  workoutSchedule: Array(7).fill("Rest Day"),
  weightHistory: [],
  workoutSetupComplete: false,
  trackingStyle: "scheduled",
  weeklyGoal: 3,
  rotationOrder: [],
  preferred_rest_sec: 0,
});

const normalizeSavedWorkouts = (value: unknown): unknown[][] => {
  if (!Array.isArray(value)) return Array.from({ length: 7 }, () => []);
  const rows = value.slice(0, 7).map((day) => (Array.isArray(day) ? day : []));
  while (rows.length < 7) rows.push([]);
  return rows;
};

const normalizeWorkoutSchedule = (value: unknown): string[] => {
  if (!Array.isArray(value)) return Array(7).fill("Rest Day");
  const rows = value
    .slice(0, 7)
    .map((day) => (typeof day === "string" && day.trim().length > 0 ? day : "Rest Day"));
  while (rows.length < 7) rows.push("Rest Day");
  return rows;
};

/** Normalizes any partial/raw data into a safe AppData object. */
export const normalizeAppData = (
  raw: Partial<AppData> | null | undefined
): AppData => {
  const fallback = getDefaultData();
  const parsed = raw ?? {};
  return {
    ...fallback,
    ...parsed,
    savedWorkouts: normalizeSavedWorkouts(parsed.savedWorkouts),
    workoutHistory: Array.isArray(parsed.workoutHistory) ? parsed.workoutHistory : [],
    workoutSchedule: normalizeWorkoutSchedule(parsed.workoutSchedule),
    weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : [],
    deficitEntries: Array.isArray(parsed.deficitEntries) ? parsed.deficitEntries : [],
    workoutSetupComplete: parsed.workoutSetupComplete ?? false,
    trackingStyle: parsed.trackingStyle ?? "scheduled",
    weeklyGoal: parsed.weeklyGoal ?? 3,
    rotationOrder: Array.isArray(parsed.rotationOrder) ? parsed.rotationOrder : [],
    preferred_rest_sec:
      typeof parsed.preferred_rest_sec === "number" ? parsed.preferred_rest_sec : 0,
  };
};

export const getLocalData = (userId: string): AppData => {
  if (typeof window === "undefined") return getDefaultData();
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
  if (!raw) return getDefaultData();
  const parsed = safeJsonParse<Partial<AppData>>(raw, getDefaultData());
  return normalizeAppData(parsed);
};

export const setLocalData = (userId: string, data: AppData): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(data));
};
