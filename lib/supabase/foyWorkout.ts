import type { SupabaseClient } from "@supabase/supabase-js";

export type FOYWorkout = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type FOYWorkoutExercise = {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  order_index: number;
};

export type FOYWorkoutWithMeta = FOYWorkout & {
  last_used_at: string | null;
  exercise_count: number;
};

export type FOYWorkoutSession = {
  id: string;
  user_id: string;
  workout_id: string | null;
  started_at: string;
  ended_at: string | null;
  updated_at?: string;
  created_at?: string;
};

export type FOYSessionSet = {
  id: string;
  session_id: string;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  done: boolean;
  updated_at?: string;
  created_at?: string;
};

/** List user's workouts with last-used and exercise count. */
export async function listFOYWorkouts(
  supabase: SupabaseClient,
  userId: string
): Promise<FOYWorkoutWithMeta[]> {
  const { data: workouts, error: wErr } = await supabase
    .from("workouts")
    .select("id, user_id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (wErr) throw wErr;
  if (!workouts?.length) return [];

  const ids = workouts.map((w) => w.id);

  const [sessionsRes, exercisesRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("workout_id, started_at")
      .eq("user_id", userId)
      .in("workout_id", ids)
      .order("started_at", { ascending: false }),
    supabase
      .from("workout_exercises")
      .select("workout_id")
      .in("workout_id", ids),
  ]);

  const lastUsedByWorkout = new Map<string, string>();
  for (const row of sessionsRes.data ?? []) {
    const wid = (row as { workout_id: string | null }).workout_id;
    const at = (row as { started_at: string }).started_at;
    if (wid && !lastUsedByWorkout.has(wid)) lastUsedByWorkout.set(wid, at);
  }

  const countByWorkout = new Map<string, number>();
  for (const row of exercisesRes.data ?? []) {
    const wid = (row as { workout_id: string }).workout_id;
    countByWorkout.set(wid, (countByWorkout.get(wid) ?? 0) + 1);
  }

  return (workouts as FOYWorkout[]).map((w) => ({
    ...w,
    last_used_at: lastUsedByWorkout.get(w.id) ?? null,
    exercise_count: countByWorkout.get(w.id) ?? 0,
  }));
}

/** Create a workout and its exercises. */
export async function createFOYWorkout(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  exerciseNames: string[]
): Promise<{ workout: FOYWorkout; exercises: FOYWorkoutExercise[] }> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Workout name is required.");

  const { data: workout, error: wErr } = await supabase
    .from("workouts")
    .insert({ user_id: userId, name: trimmedName })
    .select()
    .single();
  if (wErr) throw wErr;

  if (exerciseNames.length === 0) {
    return { workout: workout as FOYWorkout, exercises: [] };
  }

  const rows = exerciseNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, i) => ({
      workout_id: (workout as FOYWorkout).id,
      user_id: userId,
      name,
      order_index: i,
    }));

  const { data: exercises, error: eErr } = await supabase
    .from("workout_exercises")
    .insert(rows)
    .select();
  if (eErr) throw eErr;

  return {
    workout: workout as FOYWorkout,
    exercises: (exercises ?? []) as FOYWorkoutExercise[],
  };
}

/** Get workout names by ids (for merge). */
export async function getFOYWorkoutNamesByIds(
  supabase: SupabaseClient,
  workoutIds: string[]
): Promise<Map<string, string>> {
  if (workoutIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name")
    .in("id", workoutIds);
  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const r = row as { id: string; name: string };
    map.set(r.id, r.name);
  }
  return map;
}

/** Get exercises for a workout. */
export async function getFOYWorkoutExercises(
  supabase: SupabaseClient,
  workoutId: string
): Promise<FOYWorkoutExercise[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FOYWorkoutExercise[];
}

/** Start a workout session (quick start). Returns session id. */
export async function startFOYWorkoutSession(
  supabase: SupabaseClient,
  userId: string,
  workoutId: string
): Promise<FOYWorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      workout_id: workoutId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as FOYWorkoutSession;
}

/** List recent sessions for the user (for background merge). */
export async function listRecentSessions(
  supabase: SupabaseClient,
  userId: string,
  limit = 30
): Promise<FOYWorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, user_id, workout_id, started_at, ended_at, updated_at, created_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as FOYWorkoutSession[];
}

/** Get a session by id (must belong to user via RLS). */
export async function getFOYWorkoutSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<FOYWorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data as FOYWorkoutSession | null;
}

/** Get session with workout name and exercises (from workout template). */
export async function getFOYSessionWithDetails(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{
  session: FOYWorkoutSession;
  workout_name: string | null;
  exercises: { name: string; order_index: number }[];
} | null> {
  const session = await getFOYWorkoutSession(supabase, sessionId);
  if (!session) return null;

  let workout_name: string | null = null;
  let exercises: { name: string; order_index: number }[] = [];

  if (session.workout_id) {
    const [wRes, eRes] = await Promise.all([
      supabase.from("workouts").select("name").eq("id", session.workout_id).maybeSingle(),
      supabase
        .from("workout_exercises")
        .select("name, order_index")
        .eq("workout_id", session.workout_id)
        .order("order_index", { ascending: true }),
    ]);
    workout_name = (wRes.data as { name: string } | null)?.name ?? null;
    exercises = (eRes.data ?? []).map((r: { name: string; order_index: number }) => ({
      name: r.name,
      order_index: r.order_index,
    }));
  }

  return { session, workout_name, exercises };
}

/** Get all sets for a session, ordered by exercise name and set_index. */
export async function getFOYSessionSets(
  supabase: SupabaseClient,
  sessionId: string
): Promise<FOYSessionSet[]> {
  const { data, error } = await supabase
    .from("session_sets")
    .select("*")
    .eq("session_id", sessionId)
    .order("exercise_name")
    .order("set_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FOYSessionSet[];
}

/** Get sets for multiple sessions (for merge). Returns flat list; group by session_id if needed. */
export async function getFOYSessionSetsBatch(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<FOYSessionSet[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("session_sets")
    .select("*")
    .in("session_id", sessionIds)
    .order("session_id")
    .order("exercise_name")
    .order("set_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FOYSessionSet[];
}

/** Insert a new set. */
export async function insertFOYSessionSet(
  supabase: SupabaseClient,
  sessionId: string,
  exerciseName: string,
  setIndex: number,
  payload?: { reps?: number | null; weight?: number | null }
): Promise<FOYSessionSet> {
  const { data, error } = await supabase
    .from("session_sets")
    .insert({
      session_id: sessionId,
      exercise_name: exerciseName.trim(),
      set_index: setIndex,
      reps: payload?.reps ?? null,
      weight: payload?.weight ?? null,
      done: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as FOYSessionSet;
}

/** Update a set (reps, weight, done). */
export async function updateFOYSessionSet(
  supabase: SupabaseClient,
  setId: string,
  payload: { reps?: number | null; weight?: number | null; done?: boolean }
): Promise<FOYSessionSet> {
  const { data, error } = await supabase
    .from("session_sets")
    .update(payload)
    .eq("id", setId)
    .select()
    .single();
  if (error) throw error;
  return data as FOYSessionSet;
}

/** End session (set ended_at). */
export async function endFOYWorkoutSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}
