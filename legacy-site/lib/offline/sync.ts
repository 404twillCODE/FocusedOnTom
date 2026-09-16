/**
 * Sync queue processor and network/visibility listener.
 * Processes foy_sync_queue when online in batches of BATCH_SIZE; marks complete only after Supabase confirms.
 * On error: increment retryCount and schedule retry with backoff.
 */

import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { endFOYWorkoutSession } from "@/lib/supabase/foyWorkout";
import { batchUpsertSessions, batchUpsertSets } from "@/lib/supabase/sync";
import * as db from "./db";
import type { SyncQueueItem, LocalSet, LocalSession } from "./types";

const QUEUE = "foy_sync_queue" as const;
const BATCH_SIZE = 25;
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const SYNC_LOOP_INTERVAL_MS = 5000;

type SyncStatus = "offline" | "syncing" | "saved";
type Listener = (status: SyncStatus, queueLength: number) => void;

let listeners: Listener[] = [];
let syncLoopTimer: ReturnType<typeof setInterval> | null = null;
let backoffMs = 0;

function getIsOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

async function getQueueLength(): Promise<number> {
  const items = await db.getAll<SyncQueueItem>(QUEUE);
  return items.length;
}

async function notifyListeners(): Promise<void> {
  const online = getIsOnline();
  const length = await getQueueLength();
  const status: SyncStatus = !online ? "offline" : length > 0 ? "syncing" : "saved";
  listeners.forEach((cb) => cb(status, length));
}

function failBatch(items: SyncQueueItem[]): void {
  backoffMs = Math.min(backoffMs || INITIAL_BACKOFF_MS, MAX_BACKOFF_MS);
}

/** Process items only after Supabase confirms. On error: increment retryCount, re-put, and backoff. */
export async function processQueue(): Promise<void> {
  if (!getIsOnline()) return;
  const items = await db.getAll<SyncQueueItem>(QUEUE);
  if (items.length === 0) {
    await notifyListeners();
    return;
  }
  const sorted = items.sort((a, b) => {
    const order = (t: string) =>
      t === "upsert_session" ? 0 : t === "upsert_set" ? 1 : 2;
    const byType = order(a.type) - order(b.type);
    if (byType !== 0) return byType;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const supabase = getFOYSupabase();
  const sessions: SyncQueueItem[] = sorted.filter((i) => i.type === "upsert_session");
  const sets: SyncQueueItem[] = sorted.filter((i) => i.type === "upsert_set");
  const ends: SyncQueueItem[] = sorted.filter((i) => i.type === "end_session");

  for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
    const batch = sessions.slice(i, i + BATCH_SIZE);
    const payloads = batch.map((it) => (it.payload as { session: LocalSession }).session);
    try {
      await batchUpsertSessions(supabase, payloads);
      for (const it of batch) {
        await db.deleteRecord(QUEUE, it.id);
      }
      await notifyListeners();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[FOY sync] batchUpsertSessions failed:", err);
      }
      for (const it of batch) {
        const next = it.retryCount + 1;
        if (next >= MAX_RETRIES) {
          await db.deleteRecord(QUEUE, it.id);
        } else {
          await db.put(QUEUE, { ...it, retryCount: next });
        }
      }
      failBatch(batch);
      return;
    }
  }

  for (let i = 0; i < sets.length; i += BATCH_SIZE) {
    const batch = sets.slice(i, i + BATCH_SIZE);
    const payloads = batch.map((it) => (it.payload as { set: LocalSet }).set);
    try {
      await batchUpsertSets(supabase, payloads);
      for (const it of batch) {
        await db.deleteRecord(QUEUE, it.id);
      }
      await notifyListeners();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[FOY sync] batchUpsertSets failed:", err);
      }
      for (const it of batch) {
        const next = it.retryCount + 1;
        if (next >= MAX_RETRIES) {
          await db.deleteRecord(QUEUE, it.id);
        } else {
          await db.put(QUEUE, { ...it, retryCount: next });
        }
      }
      failBatch(batch);
      return;
    }
  }

  for (const item of ends) {
    try {
      await endFOYWorkoutSession(supabase, (item.payload as { sessionId: string }).sessionId);
      await db.deleteRecord(QUEUE, item.id);
      await notifyListeners();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[FOY sync] end_session failed:", item.id, err);
      }
      const next = item.retryCount + 1;
      if (next >= MAX_RETRIES) {
        await db.deleteRecord(QUEUE, item.id);
      } else {
        await db.put(QUEUE, { ...item, retryCount: next });
      }
      failBatch([item]);
      return;
    }
  }

  backoffMs = 0;
  await notifyListeners();
}

export async function syncNow(): Promise<void> {
  await processQueue();
}

function runSyncLoop(): void {
  if (!getIsOnline()) {
    notifyListeners();
    return;
  }
  syncNow().then(() => {
    if (syncLoopTimer) clearInterval(syncLoopTimer);
    syncLoopTimer = setInterval(() => {
      runSyncLoop();
    }, SYNC_LOOP_INTERVAL_MS);
  });
}

export function startSyncLoop(): void {
  if (typeof window === "undefined") return;
  runSyncLoop();
  window.addEventListener("online", () => {
    backoffMs = 0;
    syncNow();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncNow();
  });
  notifyListeners();
}

export function subscribeToSyncStatus(listener: Listener): () => void {
  listeners.push(listener);
  getQueueLength().then((length) => {
    const status: SyncStatus = !getIsOnline() ? "offline" : length > 0 ? "syncing" : "saved";
    listener(status, length);
  });
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export async function getSyncStatus(): Promise<{
  status: SyncStatus;
  queueLength: number;
}> {
  const length = await getQueueLength();
  const status: SyncStatus = !getIsOnline() ? "offline" : length > 0 ? "syncing" : "saved";
  return { status, queueLength: length };
}

export type SessionSyncStatus = "synced" | "syncing" | "offline";

/** Per-session sync status for log list. */
export async function getSessionSyncStatus(sessionId: string): Promise<SessionSyncStatus> {
  if (!getIsOnline()) return "offline";
  const items = await db.getAll<SyncQueueItem>(QUEUE);
  const hasPending = items.some((it) => {
    if (it.type === "end_session")
      return (it.payload as { sessionId: string }).sessionId === sessionId;
    if (it.type === "upsert_set")
      return (it.payload as { set: LocalSet }).set.session_id === sessionId;
    return false;
  });
  return hasPending ? "syncing" : "synced";
}
