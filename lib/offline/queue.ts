/**
 * Enqueue sync operations. Call after writing to local DB.
 */

import * as db from "./db";
import type { SyncQueueItem, LocalSet, LocalSession } from "./types";

const QUEUE = "foy_sync_queue" as const;

function now(): string {
  return new Date().toISOString();
}

export async function enqueueUpsertSession(session: LocalSession): Promise<void> {
  const id = `session_${session.id}`;
  const item: SyncQueueItem = {
    id,
    type: "upsert_session",
    payload: { session },
    createdAt: now(),
    retryCount: 0,
  };
  await db.put(QUEUE, item);
}

export async function enqueueUpsertSet(set: LocalSet): Promise<void> {
  const id = `set_${set.id}`;
  const item: SyncQueueItem = {
    id,
    type: "upsert_set",
    payload: { set },
    createdAt: now(),
    retryCount: 0,
  };
  await db.put(QUEUE, item);
}

export async function enqueueEndSession(sessionId: string): Promise<void> {
  const id = `end_${sessionId}`;
  const item: SyncQueueItem = {
    id,
    type: "end_session",
    payload: { sessionId },
    createdAt: now(),
    retryCount: 0,
  };
  await db.put(QUEUE, item);
}
