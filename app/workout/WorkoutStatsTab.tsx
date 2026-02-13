"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2, Dumbbell, ChevronDown, Calendar, TrendingUp, Trash2 } from "lucide-react";
import {
  getMyLogs,
  getWorkoutStatsSummary,
  deleteLog,
} from "@/lib/supabase/workout";
import { loadAppData, updateAppData } from "./workout-tab/getfit/dataStore";
import { sanitizeExerciseDisplayText, type WorkoutHistoryEntry } from "./workout-tab/getfit/storage";

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expect = today;
  for (const d of sorted) {
    if (d !== expect) break;
    streak++;
    const next = new Date(expect);
    next.setDate(next.getDate() - 1);
    expect = next.toISOString().slice(0, 10);
  }
  return streak;
}

// ---------- History types & helpers ----------

type HistoryExercise = {
  name?: string;
  sets?: {
    reps?: number;
    weight?: number | null;
    completed?: boolean;
    setNumber?: number;
  }[];
};

function formatHistoryDate(dateStr: string, timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatHistoryTime(timestamp?: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------- History entry component ----------

function HistoryEntryCard({
  entry,
  index,
  onDelete,
}: {
  entry: WorkoutHistoryEntry;
  index: number;
  onDelete: (entry: WorkoutHistoryEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const exercises = (entry.exercises ?? []) as HistoryExercise[];
  const workoutType = entry.workoutType
    ? sanitizeExerciseDisplayText(entry.workoutType)
    : "Workout";

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length ?? 0), 0);
  const totalReps = exercises.reduce(
    (sum, ex) => sum + (ex.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0),
    0
  );

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this workout entry? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await onDelete(entry);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 overflow-hidden"
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 min-w-0 items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg3)]/30"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--ice)] text-sm">{workoutType}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--textMuted)]">
              <span>{formatHistoryDate(entry.date, entry.timestamp)}</span>
              {entry.timestamp > 0 && (
                <>
                  <span>·</span>
                  <span>{formatHistoryTime(entry.timestamp)}</span>
                </>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-[var(--textMuted)]">
              <span>{totalExercises} exercise{totalExercises !== 1 ? "s" : ""}</span>
              <span>{totalSets} sets</span>
              <span>{totalReps} reps</span>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--textMuted)] transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 mr-3 rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
          aria-label="Delete workout entry"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-2">
              {exercises.length === 0 ? (
                <p className="text-xs text-[var(--textMuted)]">No exercise details recorded.</p>
              ) : (
                exercises.map((ex, ei) => {
                  const exName = sanitizeExerciseDisplayText(ex.name) || "Exercise";
                  const sets = ex.sets ?? [];
                  const isExExpanded = expandedExercise === ei;

                  return (
                    <div
                      key={ei}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg3)]/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedExercise(isExExpanded ? null : ei)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--bg3)]/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Dumbbell className="h-3.5 w-3.5 shrink-0 text-[var(--ice)]" />
                          <span className="text-sm font-medium text-[var(--text)] truncate">
                            {exName}
                          </span>
                          <span className="shrink-0 text-xs text-[var(--textMuted)]">
                            {sets.length} set{sets.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 text-[var(--textMuted)] transition-transform duration-200 ${
                            isExExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isExExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[var(--border)] px-3 py-2 space-y-1">
                              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-[var(--textMuted)]">
                                <span className="w-5 text-center">Set</span>
                                <span className="w-14">Reps</span>
                                <span className="w-16">Weight</span>
                                <span className="ml-auto">Done</span>
                              </div>
                              {sets.map((set, si) => (
                                <div key={si} className="flex items-center gap-3 text-xs">
                                  <span className="w-5 text-center text-[var(--textMuted)]">
                                    {set.setNumber ?? si + 1}
                                  </span>
                                  <span className="w-14 text-[var(--text)]">
                                    {set.reps ?? 0} reps
                                  </span>
                                  <span className="w-16 text-[var(--textMuted)]">
                                    {set.weight != null && set.weight > 0
                                      ? `${set.weight} lbs`
                                      : "—"}
                                  </span>
                                  <span className="ml-auto">
                                    {set.completed ? (
                                      <span className="text-[var(--ice)]">✓</span>
                                    ) : (
                                      <span className="text-[var(--textMuted)]">—</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Main stats tab ----------

export function WorkoutStatsTab({ userId }: { userId: string }) {
  const [myLogs, setMyLogs] = useState<{ date: string; duration_min: number }[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [topExercises, setTopExercises] = useState<{ exercise_name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // History state
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getMyLogs(userId),
      getWorkoutStatsSummary(userId),
    ])
      .then(([logs, summary]) => {
        if (cancelled) return;
        setMyLogs(logs.map((l) => ({ date: l.date, duration_min: l.duration_min ?? 0 })));
        setVolume(summary.totalVolume);
        setTopExercises(summary.topExercises);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stats.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Load workout history
  useEffect(() => {
    setHistoryLoading(true);
    loadAppData(userId)
      .then((data) => {
        const sorted = [...(data.workoutHistory ?? [])].sort(
          (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
        );
        setHistory(sorted);
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [userId]);

  const handleDeleteHistory = async (entry: WorkoutHistoryEntry) => {
    // 1. Remove from local AppData workoutHistory
    await updateAppData(userId, (current) => ({
      ...current,
      workoutHistory: current.workoutHistory.filter(
        (h) => !(h.date === entry.date && h.timestamp === entry.timestamp)
      ),
    }));

    // 2. Remove from local state
    setHistory((prev) =>
      prev.filter((h) => !(h.date === entry.date && h.timestamp === entry.timestamp))
    );

    // 3. Try to delete the matching workout_log entry from Supabase
    // (match by date since we don't store the log ID in local history)
    try {
      const logs = await getMyLogs(userId, 200);
      const matchingLog = logs.find((l) => l.date === entry.date);
      if (matchingLog) {
        await deleteLog(matchingLog.id, userId);
      }
    } catch {
      // Feed log deletion is best-effort; local history is the source of truth
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading stats…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-400">{error}</div>
    );
  }

  const last7 = myLogs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000) < 7;
  });
  const last30 = myLogs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000) < 30;
  });
  const totalMinutes30 = last30.reduce((s, l) => s + l.duration_min, 0);
  const streak = computeStreak(myLogs.map((l) => l.date));

  const INITIAL_SHOW = 10;
  const visibleHistory = showAllHistory ? history : history.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-8 pb-24">
      {/* Summary Stats */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <Activity className="h-5 w-5 text-[var(--ice)]" />
          My Stats
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--ice)]">{streak}</p>
            <p className="text-xs text-[var(--textMuted)]">Day streak</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">{last7.length}</p>
            <p className="text-xs text-[var(--textMuted)]">Last 7 days</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">{last30.length}</p>
            <p className="text-xs text-[var(--textMuted)]">Last 30 days</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">{totalMinutes30}</p>
            <p className="text-xs text-[var(--textMuted)]">Min (30d)</p>
          </motion.div>
        </div>
      </section>

      {/* Top Exercises */}
      {topExercises.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <Dumbbell className="h-5 w-5 text-[var(--ice)]" />
            Top Lifts
          </h2>
          <div className="space-y-2">
            {volume > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-3 text-xs text-[var(--textMuted)]">
                <span className="font-medium text-[var(--text)]">Total volume:&nbsp;</span>
                {Math.round(volume).toLocaleString()}
              </div>
            )}
            <ul className="space-y-1 text-sm">
              {topExercises.map((ex) => (
                <li
                  key={ex.exercise_name}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-3 py-2"
                >
                  <span className="truncate text-[var(--text)]">{ex.exercise_name}</span>
                  <span className="text-xs text-[var(--textMuted)]">
                    {ex.count} session{ex.count !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Workout History */}
      <section>
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <Calendar className="h-5 w-5 text-[var(--ice)]" />
            Workout History
          </h2>
          <p className="mt-0.5 text-xs text-[var(--textMuted)]">
            Your complete gym progress over time
          </p>
        </div>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--ice)]" />
            <p className="text-xs text-[var(--textMuted)]">Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 py-8 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-[var(--textMuted)] opacity-50" />
            <p className="mt-2 text-sm text-[var(--textMuted)]">No workout history yet.</p>
            <p className="mt-0.5 text-xs text-[var(--textMuted)]">
              Complete a workout to start tracking your progress.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleHistory.map((entry, i) => (
              <HistoryEntryCard
                key={`${entry.date}-${entry.timestamp}`}
                entry={entry}
                index={i}
                onDelete={handleDeleteHistory}
              />
            ))}

            {history.length > INITIAL_SHOW && (
              <button
                type="button"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 py-2.5 text-xs font-medium text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/40 hover:text-[var(--text)]"
              >
                {showAllHistory ? "Show less" : `Show all ${history.length} workouts`}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
