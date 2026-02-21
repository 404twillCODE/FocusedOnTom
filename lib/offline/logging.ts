/**
 * Local-first logging API for FocusedOnYou live session.
 * All writes go to IndexedDB first, then sync queue.
 */

import * as db from "./db";
import * as queue from "./queue";
import type { LocalSession, LocalSet } from "./types";

const SESSIONS = "foy_sessions" as const;
const SETS = "foy_sets" as const;
const META = "foy_metadata" as const;

function now(): string {
  return new Date().toISOString();
}

function uuid(): string {
  return crypto.randomUUID();
}

export type SessionDetails = {
  workoutName: string | null;
  templateExercises: { name: string; order_index: number }[];
};

/** Seed local DB from Supabase (call after fetching when online). */
export async function seedSession(
  session: LocalSession,
  sets: LocalSet[],
  details?: SessionDetails
): Promise<void> {
  const sessionWithUpdated = {
    ...session,
    updated_at: session.updated_at ?? session.started_at,
  };
  await db.put(SESSIONS, sessionWithUpdated);
  for (const s of sets) {
    const withUpdated = { ...s, updated_at: s.updated_at ?? now() };
    await db.put(SETS, withUpdated);
  }
  if (details) {
    await db.put(META, {
      id: `meta_${session.id}`,
      key: "details",
      value: JSON.stringify(details),
    });
  }
}

export async function getLocalSession(
  sessionId: string
): Promise<LocalSession | undefined> {
  return db.get<LocalSession>(SESSIONS, sessionId);
}

/** All sessions, newest first. */
export async function getLocalSessions(limit = 30): Promise<LocalSession[]> {
  const all = await db.getAll<LocalSession>(SESSIONS);
  return all
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, limit);
}

/** First session with ended_at null (active workout). */
export async function getActiveSession(): Promise<LocalSession | undefined> {
  const all = await db.getAll<LocalSession>(SESSIONS);
  return all.find((s) => s.ended_at == null);
}

export async function getLocalSets(sessionId: string): Promise<LocalSet[]> {
  const all = await db.getAll<LocalSet>(SETS, {
    key: "by_session",
    value: sessionId,
  });
  return all.sort((a, b) => a.set_index - b.set_index);
}

export async function getLocalSessionDetails(
  sessionId: string
): Promise<SessionDetails | null> {
  const row = await db.get<{ id: string; key: string; value: string }>(
    META,
    `meta_${sessionId}`
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as SessionDetails;
  } catch {
    return null;
  }
}

export async function getLocalSet(setId: string): Promise<LocalSet | undefined> {
  return db.get<LocalSet>(SETS, setId);
}

/** Create a new session locally and enqueue sync. Call when starting a workout. */
export async function createSessionLocal(
  session: LocalSession,
  details?: SessionDetails
): Promise<void> {
  const withUpdated = {
    ...session,
    updated_at: session.updated_at ?? session.started_at,
  };
  await db.put(SESSIONS, withUpdated);
  if (details) {
    await db.put(META, {
      id: `meta_${session.id}`,
      key: "details",
      value: JSON.stringify(details),
    });
  }
  await queue.enqueueUpsertSession(withUpdated);
}

/** Add a set locally and enqueue sync. */
export async function addSetLocal(
  sessionId: string,
  exerciseName: string,
  setIndex: number,
  payload?: { reps?: number | null; weight?: number | null }
): Promise<LocalSet> {
  const id = uuid();
  const set: LocalSet = {
    id,
    session_id: sessionId,
    exercise_name: exerciseName.trim(),
    set_index: setIndex,
    reps: payload?.reps ?? null,
    weight: payload?.weight ?? null,
    notes: null,
    done: false,
    updated_at: now(),
  };
  await db.put(SETS, set);
  await queue.enqueueUpsertSet(set);
  return set;
}

/** Update a set in IDB only (no enqueue). Use for debounced reps/weight edits. */
export async function putSetLocal(
  setId: string,
  payload: { reps?: number | null; weight?: number | null; done?: boolean }
): Promise<LocalSet | undefined> {
  const existing = await db.get<LocalSet>(SETS, setId);
  if (!existing) return undefined;
  const updated: LocalSet = {
    ...existing,
    ...payload,
    updated_at: now(),
  };
  await db.put(SETS, updated);
  return updated;
}

/** Update a set locally and enqueue sync immediately. Use for done toggle or when not debouncing. */
export async function updateSetLocal(
  setId: string,
  payload: { reps?: number | null; weight?: number | null; done?: boolean }
): Promise<LocalSet | undefined> {
  const updated = await putSetLocal(setId, payload);
  if (updated) await queue.enqueueUpsertSet(updated);
  return updated;
}

/** Mark session ended locally and enqueue sync. */
export async function endSessionLocal(sessionId: string): Promise<void> {
  const session = await db.get<LocalSession>(SESSIONS, sessionId);
  if (!session) return;
  const updated: LocalSession = {
    ...session,
    ended_at: now(),
    updated_at: now(),
  };
  await db.put(SESSIONS, updated);
  await queue.enqueueEndSession(sessionId);
}

/** Merge remote sessions into local (local-first: only add sessions we don't have). */
export async function mergeRemoteSessionsIntoLocal(
  remoteSessions: Array<{
    id: string;
    user_id: string;
    workout_id: string | null;
    started_at: string;
    ended_at: string | null;
    updated_at?: string;
  }>,
  remoteSetsBySessionId: Map<string, LocalSet[]>,
  workoutNameByWorkoutId: Map<string, string>
): Promise<void> {
  for (const s of remoteSessions) {
    const existing = await db.get<LocalSession>(SESSIONS, s.id);
    if (existing) continue;
    const localSession: LocalSession = {
      id: s.id,
      user_id: s.user_id,
      workout_id: s.workout_id,
      started_at: s.started_at,
      ended_at: s.ended_at,
      updated_at: s.updated_at ?? s.started_at,
    };
    const sets = remoteSetsBySessionId.get(s.id) ?? [];
    const localSets: LocalSet[] = sets.map((set) => ({
      ...set,
      updated_at: (set as LocalSet & { updated_at?: string }).updated_at ?? now(),
    }));
    const workoutName = s.workout_id
      ? workoutNameByWorkoutId.get(s.workout_id) ?? null
      : null;
    await seedSession(localSession, localSets, {
      workoutName,
      templateExercises: [],
    });
  }
}
