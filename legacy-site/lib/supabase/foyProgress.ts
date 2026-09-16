import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgressSummary = {
  workoutCount: number;
  setCount: number;
  volume: number;
};

export type ProgressPR = {
  exercise_name: string;
  weight: number;
  reps: number | null;
  date: string;
};

export type DayActivity = {
  date: string;
  workoutCount: number;
  volume: number;
};

const SESSION_PAGE_SIZE = 80;
const SETS_PAGE_SIZE = 500;

/** Start of week (Monday) in YYYY-MM-DD. */
function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

/** End of week (Sunday 23:59) as ISO. */
function getWeekEnd(d: Date): string {
  const start = new Date(getWeekStart(d));
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start.toISOString();
}

/** This week's summary: workout count, set count, estimated volume (sum reps*weight). */
export async function getProgressSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<ProgressSummary> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("ended_at", weekStart)
    .lte("ended_at", weekEnd)
    .limit(SESSION_PAGE_SIZE);
  if (sErr) throw sErr;
  const sessionIds = (sessions ?? []).map((r) => (r as { id: string }).id);
  if (sessionIds.length === 0) {
    return { workoutCount: 0, setCount: 0, volume: 0 };
  }

  const { data: sets, error: setErr } = await supabase
    .from("session_sets")
    .select("reps, weight")
    .in("session_id", sessionIds)
    .limit(SETS_PAGE_SIZE);
  if (setErr) throw setErr;

  let setCount = 0;
  let volume = 0;
  for (const row of sets ?? []) {
    const r = row as { reps: number | null; weight: number | null };
    setCount += 1;
    if (r.weight != null && r.reps != null) {
      volume += r.weight * r.reps;
    }
  }
  return {
    workoutCount: sessionIds.length,
    setCount,
    volume: Math.round(volume),
  };
}

/** Top 5 PRs: best weight per exercise (with reps at that weight), then top 5 by weight. */
export async function getTopPRs(
  supabase: SupabaseClient,
  userId: string,
  limit = 5
): Promise<ProgressPR[]> {
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, ended_at")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(100);
  if (sErr) throw sErr;
  const sessionIds = (sessions ?? []).map((r) => (r as { id: string }).id);
  const endedAtBySession = new Map(
    (sessions ?? []).map((r) => [(r as { id: string }).id, (r as { ended_at: string }).ended_at])
  );
  if (sessionIds.length === 0) return [];

  const { data: sets, error: setErr } = await supabase
    .from("session_sets")
    .select("session_id, exercise_name, weight, reps")
    .in("session_id", sessionIds)
    .not("weight", "is", null)
    .order("weight", { ascending: false })
    .limit(100);
  if (setErr) throw setErr;

  const byExercise = new Map<string, { weight: number; reps: number | null; session_id: string }>();
  for (const row of sets ?? []) {
    const r = row as { session_id: string; exercise_name: string; weight: number; reps: number | null };
    if (!byExercise.has(r.exercise_name)) {
      byExercise.set(r.exercise_name, {
        weight: r.weight,
        reps: r.reps ?? null,
        session_id: r.session_id,
      });
    }
  }

  const sorted = Array.from(byExercise.entries())
    .map(([exercise_name, v]) => ({ exercise_name, ...v }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);

  return sorted.map((pr) => ({
    exercise_name: pr.exercise_name,
    weight: pr.weight,
    reps: pr.reps,
    date: endedAtBySession.get(pr.session_id)?.slice(0, 10) ?? "",
  }));
}

/** Last 14 days: workout count and volume per day (dates in YYYY-MM-DD). */
export async function getLast14DaysActivity(
  supabase: SupabaseClient,
  userId: string
): Promise<DayActivity[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);

  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, ended_at")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("ended_at", start.toISOString())
    .lte("ended_at", end.toISOString())
    .limit(SESSION_PAGE_SIZE);
  if (sErr) throw sErr;
  const sessionIds = (sessions ?? []).map((r) => (r as { id: string }).id);
  const endedAtBySession = new Map(
    (sessions ?? []).map((r) => [(r as { id: string }).id, (r as { ended_at: string }).ended_at])
  );
  if (sessionIds.length === 0) {
    return fillLast14Days([]);
  }

  const { data: sets, error: setErr } = await supabase
    .from("session_sets")
    .select("session_id, reps, weight")
    .in("session_id", sessionIds)
    .limit(SETS_PAGE_SIZE);
  if (setErr) throw setErr;

  const byDate = new Map<string, { count: number; volume: number }>();
  for (const row of sessions ?? []) {
    const r = row as { id: string; ended_at: string };
    const date = r.ended_at.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { count: 0, volume: 0 });
    byDate.get(date)!.count += 1;
  }
  for (const row of sets ?? []) {
    const r = row as { session_id: string; reps: number | null; weight: number | null };
    const date = endedAtBySession.get(r.session_id)?.slice(0, 10);
    if (!date) continue;
    if (!byDate.has(date)) byDate.set(date, { count: 0, volume: 0 });
    if (r.weight != null && r.reps != null) {
      byDate.get(date)!.volume += r.weight * r.reps;
    }
  }
  const list = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    workoutCount: v.count,
    volume: Math.round(v.volume),
  }));
  return fillLast14Days(list);
}

function fillLast14Days(rows: DayActivity[]): DayActivity[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const result: DayActivity[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    result.push(byDate.get(date) ?? { date, workoutCount: 0, volume: 0 });
  }
  return result;
}
