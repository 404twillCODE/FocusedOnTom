"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Activity,
  TrendingUp,
  Dumbbell,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import { loadAppData } from "../workout-tab/getfit/dataStore";
import { subscribe } from "@/lib/workoutLocalFirst";
import type { WorkoutHistoryEntry } from "../workout-tab/getfit/storage";
import {
  computeOverview,
  computeWeeklyBuckets,
  computeStreak,
  computeExerciseSeries,
  getUniqueExerciseNames,
  type HistoryEntryLike,
  type ExerciseSessionPoint,
} from "./progress/progressUtils";
import { Sparkline } from "./progress/Sparkline";

const HISTORY_ENTRY_LIKE = (e: WorkoutHistoryEntry): HistoryEntryLike => ({
  date: e.date,
  timestamp: e.timestamp,
  exercises: e.exercises,
  duration_min: (e as { duration_min?: number | null }).duration_min,
});

// ─── Overview cards ───

function OverviewCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4">
      <p className="text-2xl font-bold text-[var(--ice)]">{value}</p>
      <p className="text-xs text-[var(--textMuted)]">{label}</p>
      {sub != null && sub !== "" && (
        <p className="mt-0.5 text-[10px] text-[var(--textMuted)]">{sub}</p>
      )}
    </div>
  );
}

// ─── Memoized session row for exercise progress ───

const SessionRow = React.memo(function SessionRow({
  session,
}: {
  session: ExerciseSessionPoint;
}) {
  const dateStr = new Date(session.date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg2)]/40 px-3 py-2.5">
      <span className="text-sm text-[var(--text)]">{dateStr}</span>
      <span className="shrink-0 text-sm font-medium text-[var(--ice)]">
        {session.bestSetFormatted}
      </span>
    </div>
  );
});

// ─── Main tab ───

export function WorkoutProgressTab({ userId }: { userId: string }) {
  const [appData, setAppData] = useState<{ workoutHistory: WorkoutHistoryEntry[] } | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showMoreSessions, setShowMoreSessions] = useState(false);

  const history = useMemo(
    () => appData?.workoutHistory ?? [],
    [appData?.workoutHistory]
  );
  const historyLike = useMemo(
    () => history.map(HISTORY_ENTRY_LIKE),
    [history]
  );

  useEffect(() => {
    let cancelled = false;
    loadAppData(userId).then((data) => {
      if (!cancelled) setAppData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const unsub = subscribe(userId, (data) => {
      setAppData(data);
    });
    return unsub;
  }, [userId]);

  const overview7 = useMemo(
    () => computeOverview(historyLike, 7),
    [historyLike]
  );
  const overview30 = useMemo(
    () => computeOverview(historyLike, 30),
    [historyLike]
  );
  const streak = useMemo(() => computeStreak(historyLike), [historyLike]);
  const weeklyBuckets = useMemo(
    () => computeWeeklyBuckets(historyLike, 8),
    [historyLike]
  );
  const uniqueExerciseNames = useMemo(
    () => getUniqueExerciseNames(historyLike),
    [historyLike]
  );

  const filteredExerciseNames = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return uniqueExerciseNames;
    return uniqueExerciseNames.filter((n) =>
      n.toLowerCase().includes(q)
    );
  }, [uniqueExerciseNames, exerciseSearch]);

  const exerciseSeries = useMemo(() => {
    if (!selectedExercise) return null;
    return computeExerciseSeries(
      historyLike,
      selectedExercise,
      30
    );
  }, [historyLike, selectedExercise]);

  const displaySessions = useMemo(() => {
    if (!exerciseSeries) return [];
    const list = [...exerciseSeries.sessions].reverse();
    return showMoreSessions ? list : list.slice(0, 10);
  }, [exerciseSeries, showMoreSessions]);
  const hasMoreSessions =
    exerciseSeries && exerciseSeries.sessions.length > 10;

  const workoutsPerWeekData = useMemo(
    () => weeklyBuckets.map((b) => b.workouts).reverse(),
    [weeklyBuckets]
  );
  const volumePerWeekData = useMemo(
    () => weeklyBuckets.map((b) => b.volume).reverse(),
    [weeklyBuckets]
  );

  const handleSelectExercise = useCallback((name: string) => {
    setSelectedExercise(name);
    setShowExercisePicker(false);
    setExerciseSearch(name);
    setShowMoreSessions(false);
  }, []);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <div className="space-y-8 pb-24">
      {isOffline && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-xs text-amber-600 dark:text-amber-400">
          <WifiOff className="h-3.5 w-3.5" />
          Offline — data from this device
        </div>
      )}

      {/* Overview */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <Activity className="h-5 w-5 text-[var(--ice)]" />
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OverviewCard label="Last 7 days — Workouts" value={overview7.workouts} />
          <OverviewCard label="Last 7 days — Sets" value={overview7.sets} />
          <OverviewCard label="Last 7 days — Reps" value={overview7.reps} />
          <OverviewCard
            label="Last 7 days — Volume"
            value={overview7.volume.toLocaleString()}
          />
          {overview7.minutes > 0 && (
            <OverviewCard label="Last 7 days — Minutes" value={overview7.minutes} />
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OverviewCard label="Last 30 days — Workouts" value={overview30.workouts} />
          <OverviewCard label="Last 30 days — Sets" value={overview30.sets} />
          <OverviewCard label="Last 30 days — Reps" value={overview30.reps} />
          <OverviewCard
            label="Last 30 days — Volume"
            value={overview30.volume.toLocaleString()}
          />
          {overview30.minutes > 0 && (
            <OverviewCard label="Last 30 days — Minutes" value={overview30.minutes} />
          )}
        </div>
        <div className="mt-3">
          <OverviewCard label="Current streak (days)" value={streak} />
        </div>
      </section>

      {/* Trends */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <TrendingUp className="h-5 w-5 text-[var(--ice)]" />
          Trends
        </h2>
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4">
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--textMuted)]">
              Workouts per week (last 8 weeks)
            </p>
            <Sparkline
              data={workoutsPerWeekData}
              width={280}
              height={40}
              fillBelow
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--textMuted)]">
              Volume per week (last 8 weeks)
            </p>
            <Sparkline
              data={volumePerWeekData}
              width={280}
              height={40}
              fillBelow
            />
          </div>
        </div>
      </section>

      {/* Exercise Progress */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <Dumbbell className="h-5 w-5 text-[var(--ice)]" />
          Exercise Progress
        </h2>

        <div className="sticky top-0 z-10 mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/95 p-3 backdrop-blur-sm">
          <label className="sr-only" htmlFor="progress-exercise-search">
            Search exercise
          </label>
          <input
            id="progress-exercise-search"
            type="text"
            inputMode="search"
            autoComplete="off"
            placeholder="Search exercise..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            onFocus={() => setShowExercisePicker(true)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--textMuted)] focus:border-[var(--ice)] focus:outline-none focus:ring-1 focus:ring-[var(--ice)]"
            style={{ minHeight: 44 }}
          />
          {showExercisePicker && uniqueExerciseNames.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg2)]">
              {filteredExerciseNames.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--textMuted)]">
                  No matching exercises
                </p>
              ) : (
                filteredExerciseNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectExercise(name)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg3)]/60"
                    style={{ minHeight: 44 }}
                  >
                    <Dumbbell className="h-4 w-4 shrink-0 text-[var(--ice)]" />
                    {name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedExercise && exerciseSeries && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                {selectedExercise}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg2)]/60 p-3">
                <p className="text-lg font-bold text-[var(--ice)]">
                  {exerciseSeries.prBestWeight}
                </p>
                <p className="text-[10px] text-[var(--textMuted)]">Best weight</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg2)]/60 p-3">
                <p className="text-lg font-bold text-[var(--ice)]">
                  {exerciseSeries.prBestVolume.toLocaleString()}
                </p>
                <p className="text-[10px] text-[var(--textMuted)]">Best volume (session)</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg2)]/60 p-3">
                <p className="text-lg font-bold text-[var(--ice)]">
                  {exerciseSeries.prBestReps}
                </p>
                <p className="text-[10px] text-[var(--textMuted)]">Best reps (set)</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--textMuted)]">
                Best weight over time
              </p>
              <Sparkline
                data={exerciseSeries.bestWeightOverTime}
                width={280}
                height={36}
                fillBelow
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--textMuted)]">
                Recent best sets
              </p>
              <div className="space-y-2">
                {displaySessions.map((session) => (
                  <SessionRow key={`${session.date}-${session.timestamp}`} session={session} />
                ))}
                {hasMoreSessions && (
                  <button
                    type="button"
                    onClick={() => setShowMoreSessions((v) => !v)}
                    className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg2)]/60 py-2 text-sm text-[var(--ice)] transition-colors hover:bg-[var(--bg3)]/60"
                  >
                    {showMoreSessions ? "Show less" : "Show more"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showMoreSessions ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedExercise && exerciseSeries && exerciseSeries.sessions.length === 0 && (
          <p className="text-sm text-[var(--textMuted)]">
            No sessions found for this exercise.
          </p>
        )}

        {!selectedExercise && uniqueExerciseNames.length === 0 && history.length > 0 && (
          <p className="text-sm text-[var(--textMuted)]">
            Complete workouts to see exercise progress here.
          </p>
        )}
      </section>
    </div>
  );
}
