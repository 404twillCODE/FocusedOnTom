import { supabase, type Profile, type WorkoutLog, type WorkoutLogWithProfile } from "./client";

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
  const { data, error } = await supabase
    .from("workout_logs")
    .select(
      `
      id, user_id, date, workout_type, duration_min, notes, created_at,
      profiles ( username, display_name, avatar_url )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    profiles: row.profiles ?? null,
  })) as WorkoutLogWithProfile[];
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

export async function insertLog(
  userId: string,
  payload: { date: string; workout_type: string; duration_min?: number; notes?: string }
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
  payload: Partial<{ date: string; workout_type: string; duration_min: number; notes: string }>
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
