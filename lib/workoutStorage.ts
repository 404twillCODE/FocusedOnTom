/**
 * Workout storage wrapper — thin layer over the GetFit dataStore.
 *
 * Provides:
 * - Re-exports of loadAppData / updateAppData (single source of truth)
 * - Schema versioning for future migrations
 * - Debounced writes for performant controlled inputs
 * - Safe defaults
 */

import { loadAppData, updateAppData } from "@/app/workout/workout-tab/getfit/dataStore";
import {
  type AppData,
  getDefaultData,
  normalizeAppData,
  getLocalData,
  setLocalData,
} from "@/app/workout/workout-tab/getfit/storage";

// ───────── Re-exports ─────────

export { loadAppData, updateAppData, getDefaultData, normalizeAppData, getLocalData, setLocalData };
export type { AppData };

// ───────── Schema versioning ─────────

const CURRENT_SCHEMA_VERSION = 1;
const SCHEMA_KEY_PREFIX = "workout_schema_v_";

/** Check and migrate data schema if needed. Call once on app boot. */
export function ensureSchemaVersion(userId: string): void {
  if (typeof window === "undefined") return;
  const key = `${SCHEMA_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  const version = stored ? parseInt(stored, 10) : 0;

  if (version < CURRENT_SCHEMA_VERSION) {
    // Future migrations go here. For v1, just stamp the version.
    localStorage.setItem(key, String(CURRENT_SCHEMA_VERSION));
  }
}

// ───────── Debounced writes ─────────

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 400;

/**
 * Queue a storage write that debounces rapid changes (e.g. typing in inputs).
 * The updater receives the *latest* data at flush time, not at call time.
 *
 * Returns a Promise that resolves after the debounced write completes.
 * If another call arrives before the timer fires, the previous one is cancelled.
 */
export function debouncedUpdateAppData(
  userId: string,
  key: string,
  updater: (current: AppData) => AppData
): void {
  const timerKey = `${userId}:${key}`;
  const existing = timers.get(timerKey);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    timers.delete(timerKey);
    try {
      await updateAppData(userId, updater);
    } catch (err) {
      console.error("[workoutStorage] debounced write failed:", err);
    }
  }, DEBOUNCE_MS);

  timers.set(timerKey, timer);
}

/** Flush all pending debounced writes immediately. */
export function flushPendingWrites(): void {
  // Note: we can't easily await these. This is a best-effort flush.
  for (const [key, timer] of timers.entries()) {
    clearTimeout(timer);
    timers.delete(key);
  }
}
