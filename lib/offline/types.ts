/**
 * Local + sync types for FocusedOnYou offline logging.
 * All persisted records use updated_at for conflict resolution (newest wins).
 */

export type LocalSession = {
  id: string;
  user_id: string;
  workout_id: string | null;
  started_at: string;
  ended_at: string | null;
  updated_at: string;
};

export type LocalSet = {
  id: string;
  session_id: string;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  done: boolean;
  updated_at: string;
};

export type SyncQueueType =
  | "upsert_session"
  | "upsert_set"
  | "end_session";

export type SyncQueueItem = {
  id: string;
  type: SyncQueueType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
};

export type SyncStatus = "offline" | "syncing" | "saved";

export type FoyMetadata = {
  id: string;
  key: string;
  value: string;
};
