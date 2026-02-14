/**
 * Local-first workout data layer.
 * - In-memory cache is the source of truth during the session.
 * - Writes update cache immediately, then schedule persist (idle) and sync (debounced).
 * - Supabase sync is fire-and-forget with retry; never blocks UI.
 */

import {
  getDefaultData,
  getLocalData,
  setLocalData,
  normalizeAppData,
  type AppData,
} from "@/app/workout/workout-tab/getfit/storage";
import {
  getWorkoutGetfitSync,
  upsertWorkoutGetfitSync,
} from "@/lib/supabase/workout";

const PERF_DEBUG = typeof process !== "undefined" && process.env.NEXT_PUBLIC_WORKOUT_PERF_DEBUG === "true";

function perfLog(label: string, data?: Record<string, number>) {
  if (PERF_DEBUG && typeof performance !== "undefined") {
    const msg = data ? `${label} ${JSON.stringify(data)}` : label;
    // eslint-disable-next-line no-console
    console.log(`[workout-perf] ${msg}`);
  }
}

// ───────── In-memory cache & subscribe ─────────

const cache = new Map<string, AppData>();
type Listener = (data: AppData) => void;
const listeners = new Map<string, Set<Listener>>();

function notify(userId: string, data: AppData): void {
  const set = listeners.get(userId);
  if (set) {
    set.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error("[workoutLocalFirst] listener error:", e);
      }
    });
  }
}

/** Get current data from memory cache (sync). Returns undefined if not loaded yet. */
export function getAppData(userId: string): AppData | undefined {
  return cache.get(userId);
}

/** Subscribe to cache updates for a user. Returns unsubscribe. */
export function subscribe(userId: string, listener: Listener): () => void {
  if (!listeners.has(userId)) listeners.set(userId, new Set());
  listeners.get(userId)!.add(listener);
  return () => {
    listeners.get(userId)?.delete(listener);
  };
}

/** Apply a patch to in-memory data. Updates cache immediately, notifies, schedules persist & sync. Never awaits network. */
export function applyPatch(
  userId: string,
  patchFn: (current: AppData) => AppData
): AppData {
  const t0 = PERF_DEBUG ? performance.now() : 0;
  let current = cache.get(userId);
  if (!current) {
    current = getLocalData(userId);
    cache.set(userId, current);
  }
  const updated = patchFn(current);
  cache.set(userId, updated);
  notify(userId, updated);
  schedulePersist(userId);
  scheduleSync(userId);
  if (PERF_DEBUG) {
    perfLog("applyPatch", { ms: performance.now() - t0 });
  }
  return updated;
}

// ───────── Persist (localStorage) ─────────

const persistTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const persistScheduled = new Set<string>();

function doPersist(userId: string): void {
  const data = cache.get(userId);
  if (data) {
    const t0 = PERF_DEBUG ? performance.now() : 0;
    setLocalData(userId, data);
    if (PERF_DEBUG) {
      perfLog("persist", { ms: performance.now() - t0 });
    }
  }
  persistScheduled.delete(userId);
}

const schedulePersist = (userId: string): void => {
  if (persistScheduled.has(userId)) return;
  persistScheduled.add(userId);
  const run = () => {
    persistTimeouts.delete(userId);
    doPersist(userId);
  };
  if (typeof requestIdleCallback !== "undefined") {
    (requestIdleCallback as (cb: () => void, opts?: { timeout: number }) => void)(
      run,
      { timeout: 500 }
    );
  } else {
    const t = setTimeout(run, 0);
    persistTimeouts.set(userId, t);
  }
};

// ───────── Sync (Supabase) queue ─────────

const SYNC_DEBOUNCE_MS = 1500;
const SYNC_MAX_RETRIES = 4;
const SYNC_INITIAL_BACKOFF_MS = 1000;

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const syncPending = new Set<string>();
const syncRetryCount = new Map<string, number>();

function doSync(userId: string): void {
  const data = cache.get(userId);
  if (!data) {
    syncPending.delete(userId);
    return;
  }
  const t0 = PERF_DEBUG ? performance.now() : 0;
  upsertWorkoutGetfitSync(userId, data as Record<string, unknown>)
    .then(() => {
      if (PERF_DEBUG) {
        perfLog("sync success", { ms: performance.now() - t0 });
      }
      syncRetryCount.set(userId, 0);
    })
    .catch((err) => {
      const retries = syncRetryCount.get(userId) ?? 0;
      if (PERF_DEBUG) {
        perfLog("sync failed", { ms: performance.now() - t0, retries });
      }
      if (retries < SYNC_MAX_RETRIES) {
        syncRetryCount.set(userId, retries + 1);
        const backoff = SYNC_INITIAL_BACKOFF_MS * Math.pow(2, retries);
        setTimeout(() => scheduleSync(userId), backoff);
      } else {
        console.warn("[workoutLocalFirst] sync failed after retries, keeping local:", err);
        syncRetryCount.set(userId, 0);
      }
    })
    .finally(() => {
      syncPending.delete(userId);
    });
}

/** Schedule a Supabase upsert after debounce. Never blocks. */
export function scheduleSync(userId: string): void {
  const existing = syncTimers.get(userId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    syncTimers.delete(userId);
    syncPending.add(userId);
    doSync(userId);
  }, SYNC_DEBOUNCE_MS);
  syncTimers.set(userId, timer);
}

/** Run persist and sync now (best-effort). Sync runs in background with retry. */
export function flush(userId: string): void {
  const pt = persistTimeouts.get(userId);
  if (pt) {
    clearTimeout(pt);
    persistTimeouts.delete(userId);
  }
  persistScheduled.delete(userId);
  doPersist(userId);

  const st = syncTimers.get(userId);
  if (st) {
    clearTimeout(st);
    syncTimers.delete(userId);
  }
  if (!syncPending.has(userId)) {
    syncPending.add(userId);
    doSync(userId);
  }
}

/** Flush all known users (e.g. on pagehide). */
export function flushAll(): void {
  cache.forEach((_, userId) => flush(userId));
}

// ───────── Page lifecycle: flush on hide ─────────

if (typeof window !== "undefined") {
  const onHide = () => {
    flushAll();
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onHide();
  });
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
}

// ───────── Load: cache-first, then background merge ─────────

const hasMeaningfulAppData = (data: AppData): boolean => {
  const hasSavedWorkouts = data.savedWorkouts.some((day) => day.length > 0);
  const hasHistory = data.workoutHistory.length > 0;
  const hasWeights = data.weightHistory.length > 0;
  const hasDeficit = data.deficitEntries.length > 0;
  return hasSavedWorkouts || hasHistory || hasWeights || hasDeficit;
};

/**
 * Load app data: return from cache if present; else load from localStorage into cache and return.
 * Then in background fetch remote and merge (remote overwrites cache if present).
 * Never blocks UI on network.
 */
export function loadAppData(userId: string): Promise<AppData> {
  const cached = cache.get(userId);
  if (cached) {
    return Promise.resolve(cached);
  }
  const local = getLocalData(userId);
  cache.set(userId, local);
  notify(userId, local);

  // Background: fetch remote and merge
  Promise.resolve()
    .then(() => getWorkoutGetfitSync(userId))
    .then((remote) => {
      if (!remote) {
        if (hasMeaningfulAppData(local)) {
          scheduleSync(userId);
        }
        return;
      }
      const normalized = normalizeAppData(remote as Partial<AppData>);
      cache.set(userId, normalized);
      setLocalData(userId, normalized);
      notify(userId, normalized);
    })
    .catch((err) => {
      console.warn("[workoutLocalFirst] background merge failed:", err);
    });

  return Promise.resolve(local);
}
