/**
 * Pure helpers for Progress tab — single-pass, O(N) over history.
 * Uses minimal entry shape: { date, timestamp, exercises } with optional duration_min.
 */

import { getStartOfWeek } from "../../workout-tab/getfit/storage";

export type HistoryEntryLike = {
  date: string;
  timestamp: number;
  exercises: unknown[];
  duration_min?: number | null;
};

type SetLike = { reps?: number | null; weight?: number | null; completed?: boolean };
type ExLike = { name?: unknown; sets?: SetLike[] };

/** Normalize exercise name for comparison: trim, lowercase. */
export function normalizeExerciseName(s: string): string {
  return s.trim().toLowerCase();
}

/** Get display-safe exercise name from raw value. */
function exName(raw: unknown): string {
  if (raw == null) return "";
  const str = typeof raw === "string" ? raw : String(raw);
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/** Volume for one set: reps * (weight ?? 0). Only count if completed. */
function setVolume(s: SetLike, completedOnly: boolean): number {
  if (completedOnly && !s.completed) return 0;
  const r = s.reps ?? 0;
  const w = s.weight ?? 0;
  return r * (w != null ? w : 0);
}

export type OverviewMetrics = {
  workouts: number;
  sets: number;
  reps: number;
  volume: number;
  minutes: number;
};

/**
 * Compute overview for entries within the last `days` days (by entry.date).
 * Single pass. Only completed sets count for sets/reps/volume.
 */
export function computeOverview(
  history: HistoryEntryLike[],
  days: number
): OverviewMetrics {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  let workouts = 0;
  let sets = 0;
  let reps = 0;
  let volume = 0;
  let minutes = 0;
  const seenDates = new Set<string>();

  for (const entry of history) {
    if (entry.date < cutoffKey) continue;
    if (!seenDates.has(entry.date)) {
      seenDates.add(entry.date);
      workouts += 1;
    }
    if (entry.duration_min != null && entry.duration_min > 0) {
      minutes += entry.duration_min;
    }
    const exercises = (entry.exercises ?? []) as ExLike[];
    for (const ex of exercises) {
      for (const s of ex.sets ?? []) {
        if (!s.completed) continue;
        sets += 1;
        reps += s.reps ?? 0;
        volume += setVolume(s, true);
      }
    }
  }
  return { workouts, sets, reps, volume, minutes };
}

export type WeekBucket = {
  weekStart: string; // YYYY-MM-DD Monday
  workouts: number;
  volume: number;
};

/**
 * Bucket history into the last `weeks` weeks (Monday-based).
 * Single pass over history.
 */
export function computeWeeklyBuckets(
  history: HistoryEntryLike[],
  weeks: number
): WeekBucket[] {
  const now = new Date();
  const buckets: WeekBucket[] = [];
  for (let i = 0; i < weeks; i++) {
    const start = getStartOfWeek(now);
    start.setDate(start.getDate() - 7 * i);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const weekKey = start.toISOString().slice(0, 10);
    buckets.push({ weekStart: weekKey, workouts: 0, volume: 0 });
  }
  const weekStartToIndex = new Map<string, number>();
  buckets.forEach((b, i) => weekStartToIndex.set(b.weekStart, i));

  for (const entry of history) {
    const d = new Date(entry.date + "T12:00:00");
    const start = getStartOfWeek(d);
    const weekKey = start.toISOString().slice(0, 10);
    const idx = weekStartToIndex.get(weekKey);
    if (idx == null) continue;
    buckets[idx].workouts += 1;
    const exercises = (entry.exercises ?? []) as ExLike[];
    for (const ex of exercises) {
      for (const s of ex.sets ?? []) {
        if (!s.completed) continue;
        buckets[idx].volume += setVolume(s, true);
      }
    }
  }

  return buckets;
}

/**
 * Consecutive days with at least one workout, counting backward from today.
 * Uses entry.date; single pass to collect dates then walk backward.
 */
export function computeStreak(history: HistoryEntryLike[]): number {
  const dates = new Set<string>();
  for (const entry of history) {
    if (entry.date) dates.add(entry.date);
  }
  if (dates.size === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let expect = today;
  const sorted = Array.from(dates).sort((a, b) => b.localeCompare(a));
  for (const d of sorted) {
    if (d !== expect) break;
    streak += 1;
    const next = new Date(expect);
    next.setDate(next.getDate() - 1);
    expect = next.toISOString().slice(0, 10);
  }
  return streak;
}

export type ExerciseSessionPoint = {
  date: string;
  timestamp: number;
  bestWeight: number;
  bestVolumeInSession: number;
  bestRepsInSet: number;
  bestSetFormatted: string; // e.g. "100 × 10" or "15 reps"
};

export type ExerciseSeriesResult = {
  sessions: ExerciseSessionPoint[];
  prBestWeight: number;
  prBestVolume: number;
  prBestReps: number;
  bestWeightOverTime: number[]; // ordered by session date (oldest first) for sparkline
};

/**
 * Get last N sessions that contain the given exercise (normalized name).
 * Compute PRs and best-weight-over-time for sparkline.
 * Single pass: collect matching sessions, then derive PRs and series.
 */
export function computeExerciseSeries(
  history: HistoryEntryLike[],
  exerciseNameNormalized: string,
  maxSessions: number
): ExerciseSeriesResult {
  const nameKey = exerciseNameNormalized.trim().toLowerCase();
  if (!nameKey) {
    return {
      sessions: [],
      prBestWeight: 0,
      prBestVolume: 0,
      prBestReps: 0,
      bestWeightOverTime: [],
    };
  }

  const sessions: ExerciseSessionPoint[] = [];
  const sorted = [...history].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  for (const entry of sorted) {
    const exercises = (entry.exercises ?? []) as ExLike[];
    for (const ex of exercises) {
      const n = normalizeExerciseName(exName(ex.name));
      if (n !== nameKey) continue;
      let bestWeight = 0;
      let bestReps = 0;
      let sessionVolume = 0;
      let bestRepsForSet = 0;
      let bestWeightForSet: number | null = null;

      for (const s of ex.sets ?? []) {
        if (!s.completed) continue;
        const r = s.reps ?? 0;
        const w = s.weight ?? 0;
        if (w > bestWeight) bestWeight = w;
        if (r > bestReps) bestReps = r;
        sessionVolume += setVolume(s, true);
        const vol = setVolume(s, true);
        if (vol > bestRepsForSet * (bestWeightForSet ?? 0)) {
          bestRepsForSet = r;
          bestWeightForSet = w != null ? w : null;
        }
      }
      const bestSetFormatted =
        bestWeightForSet != null && bestWeightForSet > 0
          ? `${bestWeightForSet} × ${bestRepsForSet}`
          : `${bestRepsForSet} reps`;
      sessions.push({
        date: entry.date,
        timestamp: entry.timestamp,
        bestWeight,
        bestVolumeInSession: sessionVolume,
        bestRepsInSet: bestReps,
        bestSetFormatted,
      });
      break; // one session = one occurrence of exercise per entry
    }
  }

  const lastSessions = sessions.slice(-maxSessions);
  let prWeight = 0;
  let prVolume = 0;
  let prReps = 0;
  for (const s of lastSessions) {
    if (s.bestWeight > prWeight) prWeight = s.bestWeight;
    if (s.bestVolumeInSession > prVolume) prVolume = s.bestVolumeInSession;
    if (s.bestRepsInSet > prReps) prReps = s.bestRepsInSet;
  }
  const bestWeightOverTime = lastSessions.map((s) => s.bestWeight);

  return {
    sessions: lastSessions,
    prBestWeight: prWeight,
    prBestVolume: prVolume,
    prBestReps: prReps,
    bestWeightOverTime,
  };
}

/** De-dupe exercise names from history (case-insensitive), return sorted display names. */
export function getUniqueExerciseNames(history: HistoryEntryLike[]): string[] {
  const byLower = new Map<string, string>();
  for (const entry of history) {
    const exercises = (entry.exercises ?? []) as ExLike[];
    for (const ex of exercises) {
      const name = exName(ex.name);
      if (!name) continue;
      const lower = normalizeExerciseName(name);
      if (!byLower.has(lower)) byLower.set(lower, name);
    }
  }
  return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b));
}
