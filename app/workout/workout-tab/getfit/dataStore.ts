// GetFit-style data store for the Workout tab (Supabase sync + local fallback/cache).
import { getLocalData, normalizeAppData, setLocalData, type AppData } from "./storage";
import {
  getWorkoutGetfitSync,
  upsertWorkoutGetfitSync,
} from "@/lib/supabase/workout";

const hasMeaningfulAppData = (data: AppData): boolean => {
  const hasSavedWorkouts = data.savedWorkouts.some((day) => day.length > 0);
  const hasHistory = data.workoutHistory.length > 0;
  const hasWeights = data.weightHistory.length > 0;
  const hasDeficit = data.deficitEntries.length > 0;
  return hasSavedWorkouts || hasHistory || hasWeights || hasDeficit;
};

export const loadAppData = async (userId: string): Promise<AppData> => {
  const local = getLocalData(userId);
  const remote = await getWorkoutGetfitSync(userId);
  if (!remote) {
    // First-device bootstrap: push existing local data to Supabase once.
    if (hasMeaningfulAppData(local)) {
      await upsertWorkoutGetfitSync(userId, local as Record<string, unknown>);
    }
    return local;
  }
  const normalized = normalizeAppData(remote as Partial<AppData>);
  setLocalData(userId, normalized);
  return normalized;
};

export const updateAppData = async (
  userId: string,
  updater: (current: AppData) => AppData
): Promise<AppData> => {
  const current = await loadAppData(userId);
  const updated = updater(current);
  setLocalData(userId, updated);
  await upsertWorkoutGetfitSync(userId, updated as Record<string, unknown>);
  return updated;
};
