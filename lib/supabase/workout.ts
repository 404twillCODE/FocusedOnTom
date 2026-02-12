import { supabase, type Profile, type WorkoutLog, type WorkoutLogWithProfile } from "./client";

// ---------- Types ----------

export type TrackingStyle = "schedule" | "sequence";

export type WorkoutModes = {
  progressiveOverload: boolean;
  dropSets: boolean;
  rpe: boolean;
  supersets: boolean;
  amrap: boolean;
};

export type WorkoutPreferences = {
  timer_enabled: boolean;
  timer_default_sec: number | null;
  units: "lbs" | "kg";
  show_suggestions: boolean;
};

export type WorkoutSettings = {
  user_id: string;
  tracking_style: TrackingStyle;
  selected_days: number[] | null;
  schedule_map: Record<string, string> | null; // weekday "0".."6" -> template_id
  rotation: { index: number; template_id: string; label: string }[] | null;
  modes: WorkoutModes;
  preferences: WorkoutPreferences;
  setup_completed: boolean;
  updated_at: string;
};

export type WorkoutTemplate = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type TemplateExercise = {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  sort_order: number;
  default_sets: number | null;
  default_reps: number | null;
  default_rest_sec: number | null;
  mode: Record<string, unknown> | null;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  day_label: string | null;
  template_id: string | null;
  notes: string | null;
  duration_min: number | null;
};

export type WorkoutExerciseRow = {
  id: string;
  session_id: string;
  name: string;
  sort_order: number;
};

export type WorkoutSetRow = {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  is_done: boolean;
  is_drop_set: boolean;
  drop_set_level: number | null;
  rpe: number | null;
};

export type ExerciseHistory = {
  user_id: string;
  exercise_name: string;
  last_weight: number | null;
  last_reps: number | null;
  last_sets: number | null;
  last_done_at: string | null;
  next_weight: number | null;
  next_reps: number | null;
  next_sets: number | null;
  updated_at: string;
};

export type WorkoutStatsSummary = {
  topExercises: { exercise_name: string; count: number }[];
  totalVolume: number;
};

export type WorkoutGetfitSyncRow = {
  user_id: string;
  data: Record<string, unknown>;
  updated_at: string;
};

// ---------- Settings helpers ----------

function ensureDefaultModes(modes: Partial<WorkoutModes> | null | undefined): WorkoutModes {
  return {
    progressiveOverload: modes?.progressiveOverload ?? true,
    dropSets: modes?.dropSets ?? false,
    rpe: modes?.rpe ?? false,
    supersets: modes?.supersets ?? false,
    amrap: modes?.amrap ?? false,
  };
}

function ensureDefaultPreferences(
  prefs: Partial<WorkoutPreferences> | null | undefined
): WorkoutPreferences {
  return {
    timer_enabled: prefs?.timer_enabled ?? false,
    timer_default_sec: prefs?.timer_default_sec ?? 90,
    units: prefs?.units ?? "lbs",
    show_suggestions: prefs?.show_suggestions ?? true,
  };
}

export async function getWorkoutSettings(userId: string): Promise<WorkoutSettings | null> {
  const { data, error } = await supabase
    .from("workout_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;
  const row = data as WorkoutSettings;
  return {
    ...row,
    modes: ensureDefaultModes(row.modes as Partial<WorkoutModes>),
    preferences: ensureDefaultPreferences(row.preferences as Partial<WorkoutPreferences>),
  };
}

export async function upsertWorkoutSettings(
  userId: string,
  payload: Partial<Omit<WorkoutSettings, "user_id" | "updated_at">>
): Promise<WorkoutSettings> {
  const nextModes = ensureDefaultModes((payload.modes ?? {}) as Partial<WorkoutModes>);
  const nextPrefs = ensureDefaultPreferences(
    (payload.preferences ?? {}) as Partial<WorkoutPreferences>
  );
  const { data, error } = await supabase
    .from("workout_settings")
    .upsert(
      { user_id: userId, ...payload, modes: nextModes, preferences: nextPrefs },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  const row = data as WorkoutSettings;
  return {
    ...row,
    modes: ensureDefaultModes(row.modes as Partial<WorkoutModes>),
    preferences: ensureDefaultPreferences(row.preferences as Partial<WorkoutPreferences>),
  };
}

export async function resetWorkoutSetup(userId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_settings")
    .update({ setup_completed: false })
    .eq("user_id", userId);
  if (error) throw error;
}

/** Suggested workout for today based on schedule or rotation. */
export function getSuggestedToday(settings: WorkoutSettings): { label: string; templateId: string | null } | null {
  if (!settings) return null;
  if (settings.tracking_style === "schedule" && settings.schedule_map && settings.selected_days?.length) {
    const today = new Date().getDay();
    const templateId = settings.schedule_map[String(today)] ?? null;
    if (templateId) return { label: "Today's workout", templateId };
    return null;
  }
  if (settings.tracking_style === "sequence" && settings.rotation?.length) {
    const first = settings.rotation[0] as { index?: number; template_id: string; label: string } | undefined;
    if (!first) return null;
    return {
      label: first.label ?? "Day 1",
      templateId: first.template_id ?? null,
    };
  }
  return null;
}

/** Deletes all workout data for the user and resets setup so the wizard runs again. */
export async function resetWorkoutEverything(userId: string): Promise<void> {
  await supabase.from("workout_getfit_sync").delete().eq("user_id", userId);
  await supabase.from("workout_sessions").delete().eq("user_id", userId);
  await supabase.from("template_exercises").delete().eq("user_id", userId);
  await supabase.from("workout_templates").delete().eq("user_id", userId);
  await supabase.from("exercise_history").delete().eq("user_id", userId);
  const { error } = await supabase
    .from("workout_settings")
    .update({ setup_completed: false })
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------- GetFit sync ----------

export async function getWorkoutGetfitSync(
  userId: string
): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from("workout_getfit_sync")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;
    return (data as { data?: Record<string, unknown> }).data ?? null;
  } catch (error) {
    // Keep app usable when table/migration is not applied yet.
    console.warn("workout_getfit_sync read failed; using local data fallback.", error);
    return null;
  }
}

export async function upsertWorkoutGetfitSync(
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from("workout_getfit_sync")
      .upsert({ user_id: userId, data: payload }, { onConflict: "user_id" });
    if (error) throw error;
  } catch (error) {
    // Keep app usable when table/migration is not applied yet.
    console.warn("workout_getfit_sync write failed; data is local-only on this device.", error);
  }
}

// ---------- Default template exercises ----------

const DEFAULT_EXERCISES_BY_TEMPLATE_NAME: Record<string, string[]> = {
  Push: [
    "Bench Press",
    "Overhead Press",
    "Incline Dumbbell Press",
    "Tricep Pushdown",
    "Lateral Raise",
  ],
  Pull: [
    "Barbell Row",
    "Lat Pulldown",
    "Cable Row",
    "Bicep Curl",
    "Face Pull",
  ],
  Legs: [
    "Barbell Squat",
    "Romanian Deadlift",
    "Leg Press",
    "Leg Curl",
    "Calf Raise",
  ],
  Upper: [
    "Bench Press",
    "Overhead Press",
    "Barbell Row",
    "Lat Pulldown",
    "Bicep Curl",
  ],
  Lower: [
    "Barbell Squat",
    "Romanian Deadlift",
    "Leg Press",
    "Leg Curl",
    "Calf Raise",
  ],
  "Full Body": [
    "Barbell Squat",
    "Bench Press",
    "Barbell Row",
    "Overhead Press",
    "Romanian Deadlift",
  ],
};

/** Default exercise names for a template by display name (e.g. Push, Pull, Legs). Custom returns []. */
export function getDefaultExercisesForTemplateName(
  name: string
): { name: string; sort_order: number }[] {
  const names = DEFAULT_EXERCISES_BY_TEMPLATE_NAME[name] ?? [];
  return names.map((name, i) => ({ name, sort_order: i }));
}

// ---------- Templates ----------

export async function getUserTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkoutTemplate[];
}

export async function getTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  const { data, error } = await supabase
    .from("template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TemplateExercise[];
}

export async function createTemplateWithExercises(
  userId: string,
  name: string,
  exercises: {
    name: string;
    sort_order: number;
    default_sets?: number | null;
    default_reps?: number | null;
    default_rest_sec?: number | null;
  }[]
): Promise<{ template: WorkoutTemplate; exercises: TemplateExercise[] }> {
  const { data: templateData, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (templateError) throw templateError;
  const template = templateData as WorkoutTemplate;

  if (exercises.length === 0) {
    return { template, exercises: [] };
  }

  const { data: exData, error: exError } = await supabase
    .from("template_exercises")
    .insert(
      exercises.map((e) => ({
        ...e,
        user_id: userId,
        template_id: template.id,
      }))
    )
    .select();
  if (exError) throw exError;
  return { template, exercises: (exData ?? []) as TemplateExercise[] };
}

// ---------- Sessions & logging ----------

export async function getActiveSession(userId: string): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data ?? null) as WorkoutSession | null;
}

export async function getLastCompletedSession(
  userId: string
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data ?? null) as WorkoutSession | null;
}

export async function getSessionWithDetails(sessionId: string): Promise<{
  session: WorkoutSession;
  exercises: WorkoutExerciseRow[];
  sets: WorkoutSetRow[];
}> {
  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (sErr) throw sErr;

  const { data: exercises, error: eErr } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });
  if (eErr) throw eErr;

  const { data: sets, error: setErr } = await supabase
    .from("workout_sets")
    .select("*")
    .in(
      "exercise_id",
      (exercises ?? []).map((e) => e.id)
    );
  if (setErr) throw setErr;

  return {
    session: session as WorkoutSession,
    exercises: (exercises ?? []) as WorkoutExerciseRow[],
    sets: (sets ?? []) as WorkoutSetRow[],
  };
}

export async function getMySessions(
  userId: string,
  limit = 30
): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkoutSession[];
}

export async function updateSession(
  sessionId: string,
  userId: string,
  payload: { notes?: string | null; duration_min?: number | null }
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update(payload)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSession;
}

export async function deleteSession(sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
}

export type StartSessionParams = {
  userId: string;
  dayLabel: string;
  templateId?: string | null;
};

export async function startWorkoutSession(
  params: StartSessionParams
): Promise<{ session: WorkoutSession; exercises: WorkoutExerciseRow[] }> {
  const { userId, dayLabel, templateId } = params;
  const { data: sessionData, error: sErr } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      day_label: dayLabel,
      template_id: templateId ?? null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (sErr) throw sErr;
  const session = sessionData as WorkoutSession;

  if (!templateId) {
    return { session, exercises: [] };
  }

  const templateExercises = await getTemplateExercises(templateId);
  if (templateExercises.length === 0) {
    return { session, exercises: [] };
  }

  const { data: exRows, error: exErr } = await supabase
    .from("workout_exercises")
    .insert(
      templateExercises.map((e) => ({
        session_id: session.id,
        name: e.name,
        sort_order: e.sort_order,
      }))
    )
    .select();
  if (exErr) throw exErr;

  return { session, exercises: (exRows ?? []) as WorkoutExerciseRow[] };
}

/** Add template exercises to an existing session (e.g. "Log workout anyway" → user picks Push → Use template). */
export async function addTemplateToSession(
  sessionId: string,
  userId: string,
  templateId: string
): Promise<WorkoutExerciseRow[]> {
  const templateExercises = await getTemplateExercises(templateId);
  if (templateExercises.length === 0) {
    return [];
  }
  const { data: exRows, error } = await supabase
    .from("workout_exercises")
    .insert(
      templateExercises.map((e) => ({
        session_id: sessionId,
        name: e.name,
        sort_order: e.sort_order,
      }))
    )
    .select();
  if (error) throw error;
  return (exRows ?? []) as WorkoutExerciseRow[];
}

export type FinishSessionPayload = {
  userId: string;
  sessionId: string;
  notes?: string;
  durationMin?: number | null;
  exercises: {
    name: string;
    sets: {
      set_number: number;
      reps: number | null;
      weight: number | null;
      is_done: boolean;
      is_drop_set: boolean;
      drop_set_level: number | null;
      rpe: number | null;
    }[];
  }[];
  modes: WorkoutModes;
};

export async function finishWorkoutSession(payload: FinishSessionPayload): Promise<void> {
  const { userId, sessionId, notes, durationMin, exercises, modes } = payload;

  const endedAt = new Date().toISOString();

  const { error: sErr } = await supabase
    .from("workout_sessions")
    .update({
      ended_at: endedAt,
      notes: notes ?? null,
      duration_min: durationMin ?? null,
    })
    .eq("id", sessionId);
  if (sErr) throw sErr;

  if (exercises.length === 0) {
    return;
  }

  const { data: exRows, error: exErr } = await supabase
    .from("workout_exercises")
    .insert(
      exercises.map((e, idx) => ({
        session_id: sessionId,
        name: e.name,
        sort_order: idx,
      }))
    )
    .select();
  if (exErr) throw exErr;
  const insertedExercises = (exRows ?? []) as WorkoutExerciseRow[];

  const setsToInsert: Omit<WorkoutSetRow, "id">[] = [];
  for (const ex of exercises) {
    const exRow = insertedExercises.find((r) => r.name === ex.name);
    if (!exRow) continue;
    for (const set of ex.sets) {
      setsToInsert.push({
        exercise_id: exRow.id,
        set_number: set.set_number,
        reps: set.reps,
        weight: set.weight,
        is_done: set.is_done,
        is_drop_set: set.is_drop_set,
        drop_set_level: set.drop_set_level,
        rpe: set.rpe,
      });
    }
  }

  if (setsToInsert.length > 0) {
    const { error: setErr } = await supabase.from("workout_sets").insert(setsToInsert);
    if (setErr) throw setErr;
  }

  // Optionally mirror a summary row into workout_logs for existing feed / leaderboard.
  const mainExercise = exercises[0];
  if (mainExercise) {
    const reps = mainExercise.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
    const avgWeight =
      mainExercise.sets.reduce((sum, s) => sum + (s.weight ?? 0), 0) /
      (mainExercise.sets.filter((s) => s.weight != null).length || 1);

    const dateStr = endedAt.slice(0, 10);
    await insertLogFromSession({
      date: dateStr,
      workout_type: mainExercise.name.toLowerCase(),
      workout_name: mainExercise.name,
      reps: reps || null,
      sets: mainExercise.sets.length || null,
      lbs: Number.isFinite(avgWeight) ? Math.round(avgWeight) : null,
      duration_min: durationMin ?? undefined,
      notes: notes ?? undefined,
    });
  }

  if (modes.progressiveOverload) {
    await updateExerciseHistoryFromSession(userId, exercises);
  }
}

// ---------- Exercise history & suggestions ----------

export async function getExerciseHistoryForNames(
  userId: string,
  names: string[]
): Promise<Map<string, ExerciseHistory>> {
  if (names.length === 0) return new Map();
  const { data, error } = await supabase
    .from("exercise_history")
    .select("*")
    .eq("user_id", userId)
    .in("exercise_name", names);
  if (error) throw error;
  const map = new Map<string, ExerciseHistory>();
  for (const row of data ?? []) {
    const h = row as ExerciseHistory;
    map.set(h.exercise_name, h);
  }
  return map;
}

async function updateExerciseHistoryFromSession(
  userId: string,
  exercises: FinishSessionPayload["exercises"]
): Promise<void> {
  const updates: {
    user_id: string;
    exercise_name: string;
    last_weight: number | null;
    last_reps: number | null;
    last_sets: number | null;
    next_weight: number | null;
    next_reps: number | null;
    next_sets: number | null;
    updated_at: string;
  }[] = [];

  for (const ex of exercises) {
    const doneSets = ex.sets.filter((s) => s.is_done && s.weight != null && s.reps != null);
    if (doneSets.length === 0) continue;
    const last = doneSets[doneSets.length - 1];
    const lastWeight = last.weight ?? null;
    const lastReps = last.reps ?? null;
    const lastSets = doneSets.length;

    let nextWeight: number | null = lastWeight;
    let nextReps: number | null = lastReps;
    let nextSets: number | null = lastSets;

    if (lastWeight != null && lastReps != null) {
      // If user hit >= last reps at last weight, suggest +5 lb (or +2.5 for lighter)
      const increment = lastWeight >= 100 ? 5 : 2.5;
      nextWeight = lastWeight + increment;
      nextReps = lastReps >= 10 ? 10 : lastReps;
    }

    updates.push({
      user_id: userId,
      exercise_name: ex.name,
      last_weight: lastWeight,
      last_reps: lastReps,
      last_sets: lastSets,
      next_weight: nextWeight,
      next_reps: nextReps,
      next_sets: nextSets,
      updated_at: new Date().toISOString(),
    });
  }

  if (updates.length === 0) return;

  const { error } = await supabase.from("exercise_history").upsert(updates, {
    onConflict: "user_id,exercise_name",
    ignoreDuplicates: false,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update exercise history", error);
  }
}

// ---------- Stats helpers ----------

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(
  userId: string,
  payload: { username: string; display_name: string; avatar_url?: string | null }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...payload }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getCommunityFeed(limit = 50): Promise<WorkoutLogWithProfile[]> {
  const { data: logs, error: logsError } = await supabase
    .from("workout_logs")
    .select("id, user_id, date, workout_type, workout_name, reps, sets, lbs, duration_min, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (logsError) throw logsError;

  const logRows = (logs ?? []) as WorkoutLog[];
  if (logRows.length === 0) return [];

  const userIds = Array.from(new Set(logRows.map((l) => l.user_id).filter(Boolean)));
  let profileMap = new Map<
    string,
    Pick<Profile, "username" | "display_name" | "avatar_url">
  >();

  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);
    if (profilesError) throw profilesError;
    profileMap = new Map(
      (profilesData ?? []).map((p) => [
        p.id as string,
        {
          username: p.username as string,
          display_name: p.display_name as string,
          avatar_url: (p.avatar_url ?? null) as string | null,
        },
      ])
    );
  }

  return logRows.map((row) => ({
    ...row,
    profiles: profileMap.get(row.user_id) ?? null,
  }));
}

export async function getMyLogs(userId: string, limit = 50): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkoutLog[];
}

export async function getLogsByUser(userId: string, days = 30): Promise<WorkoutLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", sinceStr)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkoutLog[];
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("username");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getWorkoutStatsSummary(userId: string): Promise<WorkoutStatsSummary> {
  // Top exercises & total volume from session-based logging when available.
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      name,
      workout_sets (
        reps,
        weight
      )
    `
    )
    .in(
      "session_id",
      (
        await supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", userId)
      ).data?.map((s) => s.id) ?? []
    );
  if (error) {
    // Fallback: no extra stats
    return { topExercises: [], totalVolume: 0 };
  }

  const counts = new Map<string, number>();
  let totalVolume = 0;

  for (const row of data ?? []) {
    const name = (row as { name: string }).name;
    const sets = (row as { workout_sets: { reps: number | null; weight: number | null }[] })
      .workout_sets;
    counts.set(name, (counts.get(name) ?? 0) + 1);
    for (const set of sets ?? []) {
      if (set.reps != null && set.weight != null) {
        totalVolume += set.reps * Number(set.weight);
      }
    }
  }

  const topExercises = Array.from(counts.entries())
    .map(([exercise_name, count]) => ({ exercise_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { topExercises, totalVolume };
}

export async function getCommunityLeaderboard(weekStart: string, weekEnd: string) {
  const { data: logs, error } = await supabase
    .from("workout_logs")
    .select("user_id, duration_min")
    .gte("date", weekStart)
    .lte("date", weekEnd);
  if (error) throw error;

  const byUser = new Map<string, { count: number; minutes: number }>();
  for (const row of logs ?? []) {
    const cur = byUser.get(row.user_id) ?? { count: 0, minutes: 0 };
    cur.count += 1;
    cur.minutes += row.duration_min ?? 0;
    byUser.set(row.user_id, cur);
  }
  return Array.from(byUser.entries()).map(([user_id, agg]) => ({ user_id, ...agg }));
}

async function insertLogFromSession(
  payload: {
    date: string;
    workout_type: string;
    workout_name?: string | null;
    reps?: number | null;
    sets?: number | null;
    lbs?: number | null;
    duration_min?: number;
    notes?: string;
  }
): Promise<void> {
  // Caller must already be authenticated in Supabase; we rely on RLS to attach user_id via client.
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("workout_logs").insert({
    user_id: userId,
    ...payload,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to mirror workout_logs from session", error);
  }
}

export async function insertLog(
  userId: string,
  payload: {
    date: string;
    workout_type: string;
    workout_name?: string | null;
    reps?: number | null;
    sets?: number | null;
    lbs?: number | null;
    duration_min?: number;
    notes?: string;
  }
): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from("workout_logs")
    .insert({ user_id: userId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutLog;
}

export async function updateLog(
  logId: string,
  userId: string,
  payload: Partial<{
    date: string;
    workout_type: string;
    workout_name: string | null;
    reps: number | null;
    sets: number | null;
    lbs: number | null;
    duration_min: number;
    notes: string;
  }>
): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from("workout_logs")
    .update(payload)
    .eq("id", logId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutLog;
}

export async function deleteLog(logId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId);
  if (error) throw error;
}
