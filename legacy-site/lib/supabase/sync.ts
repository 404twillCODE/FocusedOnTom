/**
 * Server-safe Supabase sync: idempotent upserts for sessions and sets.
 * Use with authenticated client (RLS enforces user_id / session ownership).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncSession = {
  id: string;
  user_id: string;
  workout_id: string | null;
  started_at: string;
  ended_at: string | null;
  updated_at: string;
  created_at?: string;
};

export type SyncSet = {
  id: string;
  session_id: string;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  done: boolean;
  updated_at: string;
  created_at?: string;
};

const SESSIONS_TABLE = "workout_sessions" as const;
const SETS_TABLE = "session_sets" as const;

function toSessionRow(session: SyncSession): Record<string, unknown> {
  return {
    id: session.id,
    user_id: session.user_id,
    workout_id: session.workout_id,
    started_at: session.started_at,
    ended_at: session.ended_at,
    updated_at: session.updated_at,
    created_at: session.created_at ?? session.started_at,
  };
}

function toSetRow(set: SyncSet): Record<string, unknown> {
  return {
    id: set.id,
    session_id: set.session_id,
    exercise_name: set.exercise_name,
    set_index: set.set_index,
    reps: set.reps,
    weight: set.weight,
    notes: set.notes,
    done: set.done ?? false,
    updated_at: set.updated_at,
    created_at: set.created_at ?? set.updated_at,
  };
}

/** Upsert a single session (insert or update on id). RLS: user_id must match auth.uid(). */
export async function upsertSession(
  supabase: SupabaseClient,
  session: SyncSession
): Promise<void> {
  const row = toSessionRow(session);
  const { error } = await supabase
    .from(SESSIONS_TABLE)
    .upsert(row, { onConflict: "id" });
  if (error) throw error;
}

/** Upsert a single set (insert or update on id). RLS: session must belong to auth.uid(). */
export async function upsertSet(
  supabase: SupabaseClient,
  set: SyncSet
): Promise<void> {
  const row = toSetRow(set);
  const { error } = await supabase
    .from(SETS_TABLE)
    .upsert(row, { onConflict: "id" });
  if (error) throw error;
}

/** Upsert up to 25 sessions in one request. Fails entirely if any row violates RLS or constraints. */
export async function batchUpsertSessions(
  supabase: SupabaseClient,
  sessions: SyncSession[]
): Promise<void> {
  if (sessions.length === 0) return;
  const rows = sessions.map(toSessionRow);
  const { error } = await supabase
    .from(SESSIONS_TABLE)
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

/** Upsert up to 25 sets in one request. Fails entirely if any row violates RLS or constraints. */
export async function batchUpsertSets(
  supabase: SupabaseClient,
  sets: SyncSet[]
): Promise<void> {
  if (sets.length === 0) return;
  const rows = sets.map(toSetRow);
  const { error } = await supabase
    .from(SETS_TABLE)
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
