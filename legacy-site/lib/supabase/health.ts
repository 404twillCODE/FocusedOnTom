/**
 * Health metrics and workouts for Apple Health import.
 * Upsert by (user_id, type, recorded_at) for metrics and (user_id, recorded_at) for workouts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type HealthMetricRow = {
  user_id: string;
  type: "weight" | "steps" | "active_energy";
  value: number;
  unit: string | null;
  recorded_at: string;
  source?: string;
  updated_at?: string;
};

export type HealthWorkoutRow = {
  user_id: string;
  activity: string | null;
  duration_minutes: number | null;
  calories: number | null;
  recorded_at: string;
  source?: string;
  updated_at?: string;
};

const METRICS_TABLE = "health_metrics" as const;
const WORKOUTS_TABLE = "health_workouts" as const;
const SOURCE = "apple_health_import";

function now(): string {
  return new Date().toISOString();
}

export async function upsertHealthMetric(
  supabase: SupabaseClient,
  row: HealthMetricRow
): Promise<void> {
  const { error } = await supabase.from(METRICS_TABLE).upsert(
    {
      user_id: row.user_id,
      type: row.type,
      value: row.value,
      unit: row.unit,
      recorded_at: row.recorded_at,
      source: row.source ?? SOURCE,
      updated_at: row.updated_at ?? now(),
    },
    { onConflict: "user_id,type,recorded_at" }
  );
  if (error) throw error;
}

export async function upsertHealthWorkout(
  supabase: SupabaseClient,
  row: HealthWorkoutRow
): Promise<void> {
  const { error } = await supabase.from(WORKOUTS_TABLE).upsert(
    {
      user_id: row.user_id,
      activity: row.activity,
      duration_minutes: row.duration_minutes,
      calories: row.calories,
      recorded_at: row.recorded_at,
      source: row.source ?? SOURCE,
      updated_at: row.updated_at ?? now(),
    },
    { onConflict: "user_id,recorded_at" }
  );
  if (error) throw error;
}

export async function batchUpsertHealthMetrics(
  supabase: SupabaseClient,
  rows: HealthMetricRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const ts = now();
  const { error } = await supabase.from(METRICS_TABLE).upsert(
    rows.map((r) => ({
      user_id: r.user_id,
      type: r.type,
      value: r.value,
      unit: r.unit,
      recorded_at: r.recorded_at,
      source: r.source ?? SOURCE,
      updated_at: r.updated_at ?? ts,
    })),
    { onConflict: "user_id,type,recorded_at" }
  );
  if (error) throw error;
}

export async function batchUpsertHealthWorkouts(
  supabase: SupabaseClient,
  rows: HealthWorkoutRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const ts = now();
  const { error } = await supabase.from(WORKOUTS_TABLE).upsert(
    rows.map((r) => ({
      user_id: r.user_id,
      activity: r.activity,
      duration_minutes: r.duration_minutes,
      calories: r.calories,
      recorded_at: r.recorded_at,
      source: r.source ?? SOURCE,
      updated_at: r.updated_at ?? ts,
    })),
    { onConflict: "user_id,recorded_at" }
  );
  if (error) throw error;
}
