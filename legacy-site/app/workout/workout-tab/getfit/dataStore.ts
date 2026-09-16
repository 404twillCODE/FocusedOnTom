// GetFit-style data store — local-first: uses workoutLocalFirst for cache, applyPatch, and background sync.
import {
  getAppData,
  loadAppData as loadFromLocalFirst,
  applyPatch,
  flush,
  scheduleSync,
  flushAll,
} from "@/lib/workoutLocalFirst";
import type { AppData } from "./storage";

export type { AppData };

/** Load data: from memory cache if present, else from localStorage into cache; remote merge happens in background. */
export async function loadAppData(userId: string): Promise<AppData> {
  return loadFromLocalFirst(userId);
}

/**
 * Update data: applies patch to in-memory cache immediately, notifies subscribers, schedules persist & sync.
 * Returns the new data (from cache). Never awaits Supabase.
 */
export async function updateAppData(
  userId: string,
  updater: (current: AppData) => AppData
): Promise<AppData> {
  const updated = applyPatch(userId, updater);
  return updated;
}

/** Flush persist + sync for a user (e.g. before Finish workout). */
export function flushWorkoutData(userId: string): void {
  flush(userId);
}

/** Schedule sync in background (debounced). */
export function scheduleWorkoutSync(userId: string): void {
  scheduleSync(userId);
}

/** Flush all users (e.g. pagehide). */
export function flushAllWorkoutData(): void {
  flushAll();
}
