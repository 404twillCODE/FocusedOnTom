"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Loader2,
  Dumbbell,
  ChevronDown,
  Calendar,
  TrendingUp,
  Trash2,
  Search,
  Trophy,
} from "lucide-react";
import {
  getMyLogs,
  getWorkoutStatsSummary,
  deleteLog,
  getWorkoutSettings,
} from "@/lib/supabase/workout";
import { loadAppData, updateAppData } from "./workout-tab/getfit/dataStore";
import {
  sanitizeExerciseDisplayText,
  type WorkoutHistoryEntry,
} from "./workout-tab/getfit/storage";
import {
  getBestSet,
  formatBestSet,
  type HistoryExercise,
} from "@/types/workout";

function computeTotalWeight(exercises: HistoryExercise[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const s of ex.sets ?? []) {
      if (s.weight != null && s.weight > 0) total += s.weight;
    }
  }
  return total;
}

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

// ─── History helpers ───

function formatHistoryDate(dateStr: string, timestamp?: number): string {
  const date = timestamp
    ? new Date(timestamp)
    : new Date(dateStr + "T12:00:00");
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

// ─── PR detection helpers ───

/** Build a map of exercise name → all-time best weight and best reps across all history. */
function buildPRMap(
  history: WorkoutHistoryEntry[],
  excludeEntry?: WorkoutHistoryEntry
): Map<
  string,
  { bestWeight: number; bestReps: number }
> {
  const prMap = new Map<
    string,
    { bestWeight: number; bestReps: number }
  >();
  for (const entry of history) {
    if (
      excludeEntry &&
      entry.date === excludeEntry.date &&
      entry.timestamp === excludeEntry.timestamp
    )
      continue;
    const exercises = (entry.exercises ?? []) as HistoryExercise[];
    for (const ex of exercises) {
      const name = sanitizeExerciseDisplayText(ex.name)
        .trim()
        .toLowerCase();
      if (!name) continue;
      const current = prMap.get(name) ?? {
        bestWeight: 0,
        bestReps: 0,
      };
      for (const s of ex.sets ?? []) {
        const r = s.reps ?? 0;
        const w = s.weight ?? 0;
        if (w > current.bestWeight) current.bestWeight = w;
        if (r > current.bestReps) current.bestReps = r;
      }
      prMap.set(name, current);
    }
  }
  return prMap;
}

/** Check if an exercise in an entry has any PR vs prior history. */
function getExercisePRs(
  ex: HistoryExercise,
  prMapBefore: Map<
    string,
    { bestWeight: number; bestReps: number }
  >
): string[] {
  const name = sanitizeExerciseDisplayText(ex.name)
    .trim()
    .toLowerCase();
  if (!name) return [];
  const prior = prMapBefore.get(name);
  const prs: string[] = [];
  for (const s of ex.sets ?? []) {
    const r = s.reps ?? 0;
    const w = s.weight ?? 0;
    if (w > 0 && (!prior || w > prior.bestWeight)) {
      if (!prs.includes("Best Weight")) prs.push("Best Weight");
    }
    if (r > 0 && (!prior || r > prior.bestReps)) {
      if (!prs.includes("Best Reps")) prs.push("Best Reps");
    }
  }
  return prs;
}

// ─── History entry component ───

function HistoryEntryCard({
  entry,
  index,
  onDelete,
  allHistory,
  units,
}: {
  entry: WorkoutHistoryEntry;
  index: number;
  onDelete: (entry: WorkoutHistoryEntry) => void;
  allHistory: WorkoutHistoryEntry[];
  units: "lbs" | "kg";
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const exercises = (entry.exercises ?? []) as HistoryExercise[];
  const workoutType = entry.workoutType
    ? sanitizeExerciseDisplayText(entry.workoutType)
    : "Workout";

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce(
    (sum, ex) => sum + (ex.sets?.length ?? 0),
    0
  );
  const totalReps = exercises.reduce(
    (sum, ex) =>
      sum + (ex.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0),
    0
  );
  const totalWeight = computeTotalWeight(exercises);

  // Build PR map for entries BEFORE this one
  const prMapBefore = useMemo(() => {
    const idx = allHistory.findIndex(
      (h) => h.date === entry.date && h.timestamp === entry.timestamp
    );
    return buildPRMap(allHistory.slice(idx + 1)); // history is sorted newest-first
  }, [allHistory, entry]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Delete this workout entry? This cannot be undone."
      )
    )
      return;
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
      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60"
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg3)]/30"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--ice)]">
                {workoutType}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--textMuted)]">
              <span>
                {formatHistoryDate(entry.date, entry.timestamp)}
              </span>
              {entry.timestamp > 0 && (
                <>
                  <span>·</span>
                  <span>{formatHistoryTime(entry.timestamp)}</span>
                </>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-[var(--textMuted)]">
              <span>
                {totalExercises} exercise
                {totalExercises !== 1 ? "s" : ""}
              </span>
              <span>{totalSets} sets</span>
              <span>{totalReps} reps</span>
              {totalWeight > 0 && (
                <span className="font-normal text-[var(--textMuted)]">
                  {Math.round(totalWeight).toLocaleString()} {units}
                </span>
              )}
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
          className="mr-3 shrink-0 rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
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
            <div className="space-y-2 border-t border-[var(--border)] px-4 py-3">
              {exercises.length === 0 ? (
                <p className="text-xs text-[var(--textMuted)]">
                  No exercise details recorded.
                </p>
              ) : (
                exercises.map((ex, ei) => {
                  const exName =
                    sanitizeExerciseDisplayText(ex.name) || "Exercise";
                  const sets = ex.sets ?? [];
                  const isExExpanded = expandedExercise === ei;
                  const best = getBestSet(sets);
                  const prs = getExercisePRs(ex, prMapBefore);

                  return (
                    <div
                      key={ei}
                      className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg3)]/40"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedExercise(
                            isExExpanded ? null : ei
                          )
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--bg3)]/60"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Dumbbell className="h-3.5 w-3.5 shrink-0 text-[var(--ice)]" />
                          <span className="truncate text-sm font-medium text-[var(--text)]">
                            {exName}
                          </span>
                          <span className="shrink-0 text-xs text-[var(--textMuted)]">
                            {sets.length} set
                            {sets.length !== 1 ? "s" : ""}
                          </span>
                          {/* Best set inline */}
                          {best && (
                            <span className="shrink-0 rounded bg-[var(--bg2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--textMuted)]">
                              {formatBestSet(best)}
                            </span>
                          )}
                          {/* PR badges */}
                          {prs.map((pr) => (
                            <span
                              key={pr}
                              className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[var(--iceSoft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ice)]"
                            >
                              <Trophy className="h-2.5 w-2.5" />
                              {pr}
                            </span>
                          ))}
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
                            initial={{
                              height: 0,
                              opacity: 0,
                            }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 border-t border-[var(--border)] px-3 py-2">
                              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-[var(--textMuted)]">
                                <span className="w-5 text-center">
                                  Set
                                </span>
                                <span className="w-14">
                                  Reps
                                </span>
                                <span className="w-16">
                                  Weight
                                </span>
                                <span className="ml-auto">
                                  Done
                                </span>
                              </div>
                              {sets.map((set, si) => (
                                <div
                                  key={si}
                                  className="flex items-center gap-3 text-xs"
                                >
                                  <span className="w-5 text-center text-[var(--textMuted)]">
                                    {set.setNumber ??
                                      si + 1}
                                  </span>
                                  <span className="w-14 text-[var(--text)]">
                                    {set.reps ?? 0} reps
                                  </span>
                                  <span className="w-16 text-[var(--textMuted)]">
                                    {set.weight != null &&
                                    set.weight > 0
                                      ? `${set.weight} ${units}`
                                      : "—"}
                                  </span>
                                  <span className="ml-auto">
                                    {set.completed ? (
                                      <span className="text-[var(--ice)]">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-[var(--textMuted)]">
                                        —
                                      </span>
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

// ─── Progress section ───

function ProgressSection({
  history,
  units,
}: {
  history: WorkoutHistoryEntry[];
  units: "lbs" | "kg";
}) {
  const [selectedExercise, setSelectedExercise] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Build unique exercise names across all history
  const allExerciseNames = useMemo(() => {
    const nameSet = new Set<string>();
    for (const entry of history) {
      const exercises = (entry.exercises ?? []) as HistoryExercise[];
      for (const ex of exercises) {
        const name = sanitizeExerciseDisplayText(ex.name).trim();
        if (name) nameSet.add(name);
      }
    }
    return Array.from(nameSet).sort();
  }, [history]);

  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return allExerciseNames;
    const q = searchQuery.toLowerCase();
    return allExerciseNames.filter((n) => n.toLowerCase().includes(q));
  }, [allExerciseNames, searchQuery]);

  // Find last 10 sessions for the selected exercise
  const exerciseSessions = useMemo(() => {
    if (!selectedExercise) return [];
    const searchName = selectedExercise.toLowerCase();
    const sessions: {
      date: string;
      timestamp: number;
      best: ReturnType<typeof getBestSet>;
      totalWeight: number;
      totalReps: number;
    }[] = [];

    for (const entry of history) {
      const exercises = (entry.exercises ?? []) as HistoryExercise[];
      for (const ex of exercises) {
        const name = sanitizeExerciseDisplayText(ex.name)
          .trim()
          .toLowerCase();
        if (name === searchName) {
          const best = getBestSet(ex.sets);
          const totalWeight = computeTotalWeight([ex]);
          const reps =
            ex.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0;
          sessions.push({
            date: entry.date,
            timestamp: entry.timestamp,
            best,
            totalWeight,
            totalReps: reps,
          });
        }
      }
    }

    return sessions.slice(0, 10);
  }, [selectedExercise, history]);

  // Compute PRs for this exercise
  const prs = useMemo(() => {
    if (exerciseSessions.length === 0)
      return { weight: 0, totalWeight: 0, reps: 0 };
    let weight = 0,
      totalWeight = 0,
      reps = 0;
    for (const s of exerciseSessions) {
      if (s.best?.weight != null && s.best.weight > weight)
        weight = s.best.weight;
      if (s.totalWeight > totalWeight) totalWeight = s.totalWeight;
      if (s.totalReps > reps) reps = s.totalReps;
    }
    return { weight, totalWeight, reps };
  }, [exerciseSessions]);

  if (allExerciseNames.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
        <TrendingUp className="h-5 w-5 text-[var(--ice)]" />
        Progress
      </h2>

      {/* Exercise picker */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-2.5 text-left text-sm transition-colors hover:border-[var(--ice)]/40"
        >
          <span
            className={
              selectedExercise
                ? "text-[var(--text)]"
                : "text-[var(--textMuted)]"
            }
          >
            {selectedExercise || "Select an exercise…"}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--textMuted)] transition-transform ${showPicker ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] shadow-xl"
            >
              <div className="border-b border-[var(--border)] px-3 py-2">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-[var(--textMuted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exercises…"
                    className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredNames.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-[var(--textMuted)]">
                    No exercises found.
                  </p>
                ) : (
                  filteredNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedExercise(name);
                        setShowPicker(false);
                        setSearchQuery("");
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg3)]/60 ${
                        name === selectedExercise
                          ? "font-medium text-[var(--ice)]"
                          : "text-[var(--text)]"
                      }`}
                    >
                      {name}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PR indicators */}
      {selectedExercise && exerciseSessions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {prs.weight > 0 && (
            <div className="flex items-center gap-1 rounded-lg border border-[var(--ice)]/30 bg-[var(--iceSoft)]/40 px-2.5 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-[var(--ice)]" />
              <span className="text-xs text-[var(--ice)]">
                Best Weight: {prs.weight} {units}
              </span>
            </div>
          )}
          {prs.totalWeight > 0 && (
            <div className="flex items-center gap-1 rounded-lg border border-[var(--ice)]/30 bg-[var(--iceSoft)]/40 px-2.5 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-[var(--ice)]" />
              <span className="text-xs text-[var(--ice)]">
                Best Total Weight: {Math.round(prs.totalWeight).toLocaleString()} {units}
              </span>
            </div>
          )}
          {prs.reps > 0 && prs.weight === 0 && (
            <div className="flex items-center gap-1 rounded-lg border border-[var(--ice)]/30 bg-[var(--iceSoft)]/40 px-2.5 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-[var(--ice)]" />
              <span className="text-xs font-medium text-[var(--ice)]">
                Best Reps: {prs.reps}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Session list */}
      {selectedExercise && exerciseSessions.length > 0 && (
        <div className="space-y-1.5">
          {exerciseSessions.map((session, i) => {
            const date = session.timestamp
              ? new Date(session.timestamp)
              : new Date(session.date + "T12:00:00");
            return (
              <div
                key={`${session.date}-${session.timestamp}-${i}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg2)]/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[var(--textMuted)]">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {session.best && (
                    <span className="font-medium text-[var(--text)]">
                      {formatBestSet(session.best)}
                    </span>
                  )}
                  {session.totalWeight > 0 && (
                    <span className="text-[var(--textMuted)]">
                      {Math.round(session.totalWeight).toLocaleString()} {units}
                    </span>
                  )}
                  {session.totalWeight === 0 &&
                    session.totalReps > 0 && (
                      <span className="text-[var(--textMuted)]">
                        {session.totalReps} reps
                      </span>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedExercise && exerciseSessions.length === 0 && (
        <p className="text-xs text-[var(--textMuted)]">
          No sessions found for this exercise.
        </p>
      )}
    </section>
  );
}

// ─── Filter types ───

type HistoryFilter = "all" | "7" | "30";

// ─── Main stats tab ───

export function WorkoutStatsTab({ userId }: { userId: string }) {
  const [myLogs, setMyLogs] = useState<
    { date: string; duration_min: number }[]
  >([]);
  const [units, setUnits] = useState<"lbs" | "kg">("lbs");
  const [topExercises, setTopExercises] = useState<
    { exercise_name: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // History state
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Search + filter
  const [searchQuery, setSearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyLogs(userId), getWorkoutStatsSummary(userId), getWorkoutSettings(userId)])
      .then(([logs, summary, settings]) => {
        if (cancelled) return;
        setMyLogs(
          logs.map((l) => ({
            date: l.date,
            duration_min: l.duration_min ?? 0,
          }))
        );
        setTopExercises(summary.topExercises);
        setUnits(settings?.preferences.units ?? "lbs");
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Failed to load stats."
          );
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
    await updateAppData(userId, (current) => ({
      ...current,
      workoutHistory: current.workoutHistory.filter(
        (h) =>
          !(h.date === entry.date && h.timestamp === entry.timestamp)
      ),
    }));

    setHistory((prev) =>
      prev.filter(
        (h) =>
          !(h.date === entry.date && h.timestamp === entry.timestamp)
      )
    );

    try {
      const logs = await getMyLogs(userId, 200);
      const matchingLog = logs.find((l) => l.date === entry.date);
      if (matchingLog) {
        await deleteLog(matchingLog.id, userId);
      }
    } catch {
      // best-effort
    }
  };

  // Filtered history
  const filteredHistory = useMemo(() => {
    let result = history;

    // Apply date filter
    if (historyFilter !== "all") {
      const days = parseInt(historyFilter, 10);
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((h) => (h.timestamp ?? 0) > cutoff);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((h) => {
        const exercises = (h.exercises ?? []) as HistoryExercise[];
        return (
          (h.workoutType ?? "").toLowerCase().includes(q) ||
          exercises.some((ex) =>
            sanitizeExerciseDisplayText(ex.name)
              .toLowerCase()
              .includes(q)
          )
        );
      });
    }

    return result;
  }, [history, historyFilter, searchQuery]);

  const totalWeight = useMemo(
    () =>
      history.reduce((sum, entry) => {
        const exercises = (entry.exercises ?? []) as HistoryExercise[];
        return sum + computeTotalWeight(exercises);
      }, 0),
    [history]
  );

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
  const visibleHistory = showAllHistory
    ? filteredHistory
    : filteredHistory.slice(0, INITIAL_SHOW);

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
            <p className="text-2xl font-bold text-[var(--ice)]">
              {streak}
            </p>
            <p className="text-xs text-[var(--textMuted)]">Day streak</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">
              {last7.length}
            </p>
            <p className="text-xs text-[var(--textMuted)]">Last 7 days</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">
              {last30.length}
            </p>
            <p className="text-xs text-[var(--textMuted)]">Last 30 days</p>
          </motion.div>
          {totalMinutes30 > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
            >
              <p className="text-2xl font-bold text-[var(--text)]">
                {totalMinutes30}
              </p>
              <p className="text-xs text-[var(--textMuted)]">
                Min (30d)
              </p>
            </motion.div>
          )}
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
            {totalWeight > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-3 text-xs text-[var(--textMuted)]">
                <span className="text-[var(--text)]">
                  Total weight:&nbsp;
                </span>
                {Math.round(totalWeight).toLocaleString()} {units}
              </div>
            )}
            <ul className="space-y-1 text-sm">
              {topExercises.map((ex) => (
                <li
                  key={ex.exercise_name}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-3 py-2"
                >
                  <span className="truncate text-[var(--text)]">
                    {ex.exercise_name}
                  </span>
                  <span className="text-xs text-[var(--textMuted)]">
                    {ex.count} session{ex.count !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Progress */}
      {history.length > 0 && <ProgressSection history={history} units={units} />}

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

        {/* Search + Filter */}
        {history.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-3 py-2">
              <Search className="h-4 w-4 text-[var(--textMuted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise…"
                className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[var(--textMuted)] hover:text-[var(--text)]"
                >
                  <span className="text-xs">Clear</span>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(
                [
                  { value: "7", label: "Last 7 days" },
                  { value: "30", label: "Last 30" },
                  { value: "all", label: "All" },
                ] as { value: HistoryFilter; label: string }[]
              ).map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setHistoryFilter(chip.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    historyFilter === chip.value
                      ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
                      : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:border-[var(--ice)]/40"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--ice)]" />
            <p className="text-xs text-[var(--textMuted)]">
              Loading history…
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 py-8 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-[var(--textMuted)] opacity-50" />
            <p className="mt-2 text-sm text-[var(--textMuted)]">
              No workout history yet.
            </p>
            <p className="mt-0.5 text-xs text-[var(--textMuted)]">
              Complete a workout to start tracking your progress.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 py-6 text-center">
            <p className="text-sm text-[var(--textMuted)]">
              No workouts match your search.
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
                allHistory={history}
                units={units}
              />
            ))}

            {filteredHistory.length > INITIAL_SHOW && (
              <button
                type="button"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 py-2.5 text-xs font-medium text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/40 hover:text-[var(--text)]"
              >
                {showAllHistory
                  ? "Show less"
                  : `Show all ${filteredHistory.length} workouts`}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
