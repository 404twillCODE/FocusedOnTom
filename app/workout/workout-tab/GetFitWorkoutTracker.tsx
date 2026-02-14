"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Check,
  MoreHorizontal,
  Trash2,
  X,
  Dumbbell,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { loadAppData, updateAppData, flushWorkoutData } from "./getfit/dataStore";
import { subscribe } from "@/lib/workoutLocalFirst";
import type { AppData } from "./getfit/storage";
import {
  formatDateKey,
  sanitizeExerciseDisplayText,
  type TrackingStyle,
} from "./getfit/storage";
import {
  getWorkoutSettings,
  getUserTemplates,
  insertLog,
  type WorkoutSettings,
} from "@/lib/supabase/workout";
import { useToast } from "../AppToast";
import {
  type WorkoutSet,
  type Exercise,
  type ExerciseCategory,
  type SetRow,
  ALL_CATEGORIES,
} from "@/types/workout";

const PERF_DEBUG =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_WORKOUT_PERF_DEBUG === "true";

// Re-export for local compat
type Set = WorkoutSet;

/** Derive current day workouts from AppData with migration and sanitization. */
function deriveDayWorkouts(data: AppData | null, dayIndex: number): Exercise[] {
  if (!data?.savedWorkouts?.length) return [];
  const dayWorkouts = (data.savedWorkouts[dayIndex] ?? []) as unknown[];
  const migrated = dayWorkouts.map((exercise: unknown) => {
    const ex = exercise as Record<string, unknown>;
    if (!ex.categories) {
      if (ex.category) return { ...ex, categories: [ex.category] } as Exercise;
      return { ...ex, categories: ["legs"] } as Exercise;
    }
    if (!Array.isArray(ex.categories)) {
      return { ...ex, categories: [ex.categories] } as Exercise;
    }
    return ex as unknown as Exercise;
  });
  const withSetWeight = migrated.map((ex) => {
    if (!ex.sets?.length) return ex;
    return {
      ...ex,
      sets: ex.sets.map((s: Set) => ({
        ...s,
        weight: s.weight === 0 ? null : (s.weight ?? null),
      })),
    };
  });
  const sanitized = withSetWeight.map((ex) => ({
    ...ex,
    name: sanitizeExerciseDisplayText(ex.name) || ex.name || "Exercise",
    notes: ex.notes ? sanitizeExerciseDisplayText(ex.notes) : undefined,
  }));
  return Array.from(new Map(sanitized.map((e) => [e.id, e])).values());
}

// ─────────────────────────────────────────────
// SetRowCard – memoized compact row (instant input, commit on blur)
// ─────────────────────────────────────────────

const SetRowCard = React.memo(function SetRowCard({
  set,
  showWeightColumn,
  repsRef,
  onRepsBlur,
  onWeightBlur,
  onRestChange,
  onToggleComplete,
  onFieldKeyDown,
}: {
  set: Set;
  showWeightColumn: boolean;
  repsRef?: React.RefObject<HTMLInputElement | null>;
  onRepsBlur: (v: number) => void;
  onWeightBlur: (v: number | null) => void;
  onRestChange: (sec: number) => void;
  onToggleComplete: () => void;
  onFieldKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "reps" | "weight" | "rest"
  ) => void;
}) {
  const [repsInput, setRepsInput] = useState(
    set.reps != null && set.reps !== 0 ? String(set.reps) : ""
  );
  const [weightInput, setWeightInput] = useState(
    set.weight != null && set.weight !== 0 ? String(set.weight) : ""
  );
  const [restInput, setRestInput] = useState(
    set.breakTime != null && set.breakTime > 0 ? String(set.breakTime) : ""
  );
  const [editing, setEditing] = useState(!set.completed);
  const weightRef = useRef<HTMLInputElement>(null);
  const restRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRepsInput(set.reps != null && set.reps !== 0 ? String(set.reps) : "");
    setWeightInput(set.weight != null && set.weight !== 0 ? String(set.weight) : "");
    setRestInput(set.breakTime != null && set.breakTime > 0 ? String(set.breakTime) : "");
    setEditing(!set.completed);
  }, [set.reps, set.weight, set.breakTime, set.completed]);

  const restSec = Math.max(0, parseInt(restInput, 10) || 0);
  const isDone = set.completed;

  const displayRestValue = restSec > 0 ? restInput : "";

  // Handle Enter key: move focus reps → weight → rest → next set
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "reps" | "weight" | "rest"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "reps" && showWeightColumn) {
        weightRef.current?.focus();
      } else if (field === "reps" || field === "weight") {
        restRef.current?.focus();
      } else if (field === "rest") {
        // Propagate to parent so it can focus next set's reps
        onFieldKeyDown?.(e, field);
      }
    }
  };

  // When tapped on a done row, re-enable editing
  const handleRowTap = () => {
    if (isDone) {
      setEditing(true);
    }
  };

  // Grid columns: adapt based on weight visibility
  const gridCols = showWeightColumn
    ? "grid-cols-[2rem_1fr_1fr_1fr_2.5rem]"
    : "grid-cols-[2rem_1fr_1fr_2.5rem]";

  return (
    <div
      className={`grid ${gridCols} items-center gap-1.5 rounded-lg px-2 py-1.5 transition-opacity ${
        isDone && !editing ? "opacity-50" : ""
      }`}
      onClick={handleRowTap}
    >
      {/* Set # */}
      <span
        className={`text-center text-xs font-semibold ${
          isDone ? "text-[var(--ice)]" : "text-[var(--textMuted)]"
        }`}
      >
        {set.isDropSet ? "D" : set.setNumber}
      </span>

      {/* Reps */}
      <div className="flex items-center gap-0.5">
        <input
          ref={repsRef}
          type="number"
          inputMode="numeric"
          min="0"
          aria-label={`Set ${set.setNumber} reps`}
          value={repsInput}
          readOnly={isDone && !editing}
          onChange={(e) => setRepsInput(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={() => onRepsBlur(parseInt(repsInput, 10) || 0)}
          onKeyDown={(e) => handleKeyDown(e, "reps")}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-1.5 py-1.5 text-center text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
          placeholder="—"
        />
        <span className="shrink-0 text-[10px] text-[var(--textMuted)]">reps</span>
      </div>

      {/* Weight (only if exercise uses weights) */}
      {showWeightColumn && (
        <div className="flex items-center gap-0.5">
          <input
            ref={weightRef}
            type="number"
            inputMode="decimal"
            min="0"
            step="2.5"
            aria-label={`Set ${set.setNumber} weight`}
            value={weightInput}
            readOnly={isDone && !editing}
            onChange={(e) => setWeightInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => {
              const v = weightInput.trim();
              onWeightBlur(v === "" ? null : parseFloat(v) || 0);
            }}
            onKeyDown={(e) => handleKeyDown(e, "weight")}
            placeholder="—"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-1.5 py-1.5 text-center text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
          />
          <span className="shrink-0 text-[10px] text-[var(--textMuted)]">lb</span>
        </div>
      )}

      {/* Rest */}
      <div className="flex items-center gap-0.5">
        <input
          ref={restRef}
          type="number"
          inputMode="numeric"
          min="0"
          aria-label="Rest seconds"
          value={displayRestValue}
          readOnly={isDone && !editing}
          onChange={(e) => setRestInput(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={() => onRestChange(restSec)}
          onKeyDown={(e) => handleKeyDown(e, "rest")}
          placeholder="—"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-1.5 py-1.5 text-center text-sm text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
        />
        <span className="shrink-0 text-[10px] text-[var(--textMuted)]">s</span>
      </div>

      {/* Done checkbox */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-colors ${
            isDone
              ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
              : "border-[var(--border)] bg-transparent text-[var(--textMuted)] hover:border-[var(--ice)]/50"
          }`}
          aria-label={isDone ? "Mark set incomplete" : "Mark set complete"}
        >
          {isDone && <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Main Tracker
// ─────────────────────────────────────────────

export function GetFitWorkoutTracker({
  userId,
  settings: settingsProp,
}: {
  userId: string;
  settings: WorkoutSettings;
}) {
  const renderStartRef = useRef(0);
  if (PERF_DEBUG && typeof performance !== "undefined") {
    renderStartRef.current = performance.now();
  }

  const [appData, setAppData] = useState<AppData | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    if (
      settingsProp?.tracking_style === "sequence" &&
      settingsProp?.rotation?.length
    ) {
      return 0;
    }
    return new Date().getDay();
  });
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [activeBreakTimer, setActiveBreakTimer] = useState<{
    exerciseId: number;
    setIndex: number;
    timeLeft: number;
  } | null>(null);

  // Collapse state: track which exercise IDs are collapsed
  const [collapsedExercises, setCollapsedExercises] = useState<
    globalThis.Set<number>
  >(new globalThis.Set());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [focusSetKey, setFocusSetKey] = useState<string | null>(null);
  const setRepsRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const justAdvancedAfterCompleteRef = useRef(false);
  const [undoData, setUndoData] = useState<{
    exerciseId: number;
    previousSets: Set[];
  } | null>(null);

  // Derive from appData (single source of truth; subscription updates appData)
  const workoutSchedule = useMemo(
    () => appData?.workoutSchedule ?? Array(7).fill("Rest Day"),
    [appData?.workoutSchedule]
  );
  const trackingStyle = useMemo(
    () => (appData?.trackingStyle as TrackingStyle) ?? "scheduled",
    [appData?.trackingStyle]
  );
  const rotationOrder = useMemo(() => appData?.rotationOrder ?? [], [appData?.rotationOrder]);
  const workoutHistory = useMemo(
    () => appData?.workoutHistory ?? [],
    [appData?.workoutHistory]
  );
  const preferredRestSec = useMemo(
    () =>
      appData?.preferred_rest_sec ?? (settingsProp?.preferences?.timer_default_sec ?? 0),
    [appData?.preferred_rest_sec, settingsProp?.preferences?.timer_default_sec]
  );
  const workouts = useMemo(
    () => deriveDayWorkouts(appData, currentDayIndex),
    [appData, currentDayIndex]
  );

  const { showToast } = useToast();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // ───── Local-first: subscribe to cache updates so UI updates without await loadDayWorkouts ─────
  useEffect(() => {
    let cancelled = false;
    loadAppData(userId).then((data) => {
      if (!cancelled) setAppData(data);
    });
    const unsub = subscribe(userId, (data) => {
      if (!cancelled) setAppData(data);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [userId]);

  // ───── Sync schedule from Supabase settings once (when app data has default schedule) ─────
  useEffect(() => {
    if (!appData) return;
    const isDefaultSchedule =
      !appData.workoutSetupComplete &&
      appData.workoutSchedule?.length === 7 &&
      appData.workoutSchedule.every((d) => d === "Rest Day");
    if (!isDefaultSchedule) return;
    let cancelled = false;
    (async () => {
      try {
        const settings = await getWorkoutSettings(userId);
        if (cancelled || !settings?.setup_completed) return;
        const schedule: string[] = Array(7).fill("Rest Day");
        let rotOrder: string[] = [];
        if (settings.tracking_style === "schedule") {
          if (settings.schedule_map) {
            const templates = await getUserTemplates(userId);
            for (let day = 0; day < 7; day++) {
              const templateId = settings.schedule_map![String(day)];
              const name = templateId
                ? templates.find((t) => t.id === templateId)?.name
                : null;
              if (name) schedule[day] = name;
            }
          } else if (settings.selected_days?.length) {
            for (const day of settings.selected_days) {
              if (day >= 0 && day < 7) schedule[day] = "Workout";
            }
          }
        } else if (
          settings.tracking_style === "sequence" &&
          settings.rotation?.length
        ) {
          rotOrder = settings.rotation.map(
            (r) => r.label ?? `Day ${(r.index ?? 0) + 1}`
          );
          rotOrder.forEach((label, i) => {
            if (i < 7) schedule[i] = label;
          });
        }
        if (cancelled) return;
        const isSequence =
          settings.tracking_style === "sequence" && rotOrder.length > 0;
        const restFromSetup =
          settings.preferences?.timer_enabled &&
          settings.preferences.timer_default_sec != null
            ? settings.preferences.timer_default_sec
            : 0;
        updateAppData(userId, (current) => ({
          ...current,
          workoutSchedule: schedule,
          workoutSetupComplete: true,
          trackingStyle: isSequence ? "inconsistent" : "scheduled",
          rotationOrder: rotOrder,
          preferred_rest_sec: restFromSetup || current.preferred_rest_sec || 0,
        }));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, appData?.workoutSetupComplete, appData?.workoutSchedule]);

  // ───── Auto-focus when a new set is added ─────
  useEffect(() => {
    if (focusSetKey) {
      const ref = setRepsRefs.current.get(focusSetKey);
      if (ref) setTimeout(() => ref.focus(), 50);
      setFocusSetKey(null);
    }
  }, [focusSetKey, workouts]);

  // ───── Perf: log render duration (dev only) ─────
  useEffect(() => {
    if (PERF_DEBUG && typeof performance !== "undefined" && renderStartRef.current > 0) {
      const ms = performance.now() - renderStartRef.current;
      if (ms > 16) console.log(`[workout-perf] tracker render ${ms.toFixed(1)}ms`);
    }
  });

  // Break timer countdown
  useEffect(() => {
    if (activeBreakTimer && activeBreakTimer.timeLeft > 0) {
      const timer = setTimeout(() => {
        setActiveBreakTimer({
          ...activeBreakTimer,
          timeLeft: activeBreakTimer.timeLeft - 1,
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeBreakTimer && activeBreakTimer.timeLeft === 0) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      showToast("Rest timer complete! Time to go.", "timer", 4000);
      setTimeout(() => {
        setActiveBreakTimer(null);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBreakTimer]);

  const saveDayWorkouts = useCallback((updatedWorkouts: Exercise[]) => {
    updateAppData(userId, (current) => {
      const allWorkouts = current.savedWorkouts.flat() as Exercise[];
      const workoutMap = new Map<number, Exercise>();

      allWorkouts.forEach((w) => {
        if (!workoutMap.has(w.id)) {
          workoutMap.set(w.id, w);
        }
      });

      updatedWorkouts.forEach((workout) => {
        workoutMap.set(workout.id, workout);
      });

      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      workoutMap.forEach((workout) => {
        if (!workout.selectedDays || workout.selectedDays.length === 0) {
          for (let i = 0; i < 7; i++) {
            savedWorkouts[i].push(workout);
          }
        } else {
          workout.selectedDays.forEach((day) => {
            savedWorkouts[day].push(workout);
          });
        }
      });

      return { ...current, savedWorkouts };
    });
  }, [userId]);

  const addExercise = useCallback(async (exercise: Exercise) => {
    try {
      if (editingExercise) {
        updateAppData(userId, (current) => {
            const savedWorkouts: Exercise[][] = Array.from(
              { length: 7 },
              () => []
            );
            for (let day = 0; day < 7; day++) {
              const dayWorkouts = (current.savedWorkouts[day] || []) as any[];
              savedWorkouts[day] = dayWorkouts.filter(
                (e) => e.id !== editingExercise.id
              ) as Exercise[];
            }
            if (!exercise.selectedDays || exercise.selectedDays.length === 0) {
              for (let i = 0; i < 7; i++) {
                savedWorkouts[i] = [...savedWorkouts[i], exercise];
              }
            } else {
              exercise.selectedDays.forEach((day) => {
                savedWorkouts[day] = [...savedWorkouts[day], exercise];
              });
            }
            return { ...current, savedWorkouts };
          });
        setEditingExercise(null);
      } else {
        updateAppData(userId, (current) => {
          const savedWorkouts = [...current.savedWorkouts];
          if (!exercise.selectedDays || exercise.selectedDays.length === 0) {
            for (let i = 0; i < 7; i++) {
              savedWorkouts[i] = [...(savedWorkouts[i] || []), exercise];
            }
          } else {
            exercise.selectedDays.forEach((day) => {
              savedWorkouts[day] = [...(savedWorkouts[day] || []), exercise];
            });
          }
          return { ...current, savedWorkouts };
        });
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving exercise:", error);
      showToast("Failed to save exercise. Please try again.", "error");
      throw error;
    }
  }, [userId, editingExercise, showToast]);

  const removeExercise = useCallback((id: number) => {
    updateAppData(userId, (current) => {
      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      for (let day = 0; day < 7; day++) {
        const dayWorkouts = (current.savedWorkouts[day] || []) as Exercise[];
        savedWorkouts[day] = dayWorkouts.filter((e) => e.id !== id);
      }
      return { ...current, savedWorkouts };
    });
  }, [userId]);

  const toggleSetComplete = useCallback(
    (exerciseId: number, setIndex: number, breakTime?: number) => {
      const currentWorkouts = appData ? deriveDayWorkouts(appData, currentDayIndex) : [];
      const updatedWorkouts = currentWorkouts.map((exercise) => {
        if (exercise.id !== exerciseId || !exercise.sets) return exercise;
        const updatedSets = [...exercise.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          completed: !updatedSets[setIndex].completed,
        };
        if (
          breakTime &&
          updatedSets[setIndex].completed &&
          !updatedSets[setIndex].breakTime
        ) {
          updatedSets[setIndex].breakTime = breakTime;
        }
        return { ...exercise, sets: updatedSets };
      });
      saveDayWorkouts(updatedWorkouts);
      const exercise = updatedWorkouts.find((e) => e.id === exerciseId);
      if (
        exercise?.sets?.[setIndex]?.completed &&
        exercise.sets[setIndex].breakTime
      ) {
        setActiveBreakTimer({
          exerciseId,
          setIndex,
          timeLeft: exercise.sets[setIndex].breakTime!,
        });
      }
    },
    [currentDayIndex, appData, saveDayWorkouts]
  );

  const markAllDone = useCallback(
    (exerciseId: number) => {
      const exercise = workouts.find((e) => e.id === exerciseId);
      if (!exercise?.sets) return;
      if (exercise.sets.every((s) => s.completed)) return;

      setUndoData({
        exerciseId,
        previousSets: exercise.sets.map((s) => ({ ...s })),
      });

      const currentWorkouts = appData ? deriveDayWorkouts(appData, currentDayIndex) : [];
      const updatedWorkouts = currentWorkouts.map((ex) =>
        ex.id === exerciseId && ex.sets
          ? { ...ex, sets: ex.sets.map((s) => ({ ...s, completed: true })) }
          : ex
      );
      saveDayWorkouts(updatedWorkouts);
      showToast("Marked all sets done — tap to undo", "success", 5000);
    },
    [workouts, appData, currentDayIndex, saveDayWorkouts, showToast]
  );

  const undoMarkAllDone = useCallback(() => {
    if (!undoData) return;
    const currentWorkouts = appData ? deriveDayWorkouts(appData, currentDayIndex) : [];
    const updatedWorkouts = currentWorkouts.map((ex) =>
      ex.id === undoData.exerciseId ? { ...ex, sets: undoData.previousSets } : ex
    );
    saveDayWorkouts(updatedWorkouts);
    setUndoData(null);
    showToast("Undone", "info", 2000);
  }, [undoData, appData, currentDayIndex, saveDayWorkouts, showToast]);

  const updateExerciseSets = useCallback(
    (exerciseId: number, newSets: Set[]) => {
      const currentWorkouts = appData ? deriveDayWorkouts(appData, currentDayIndex) : [];
      const updatedWorkouts = currentWorkouts.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: newSets } : ex
      );
      saveDayWorkouts(updatedWorkouts);
    },
    [appData, currentDayIndex, saveDayWorkouts]
  );

  const addSetToExercise = useCallback(
    (exerciseId: number) => {
      const exercise = workouts.find((e) => e.id === exerciseId);
      if (!exercise?.sets) return;

      const lastSet = exercise.sets[exercise.sets.length - 1];
      const lastRest =
        lastSet != null && lastSet.breakTime !== undefined && lastSet.breakTime !== null
          ? lastSet.breakTime
          : preferredRestSec ?? 0;

      const newSet: Set = {
        setNumber: exercise.sets.length + 1,
        reps: lastSet?.reps ?? 0,
        weight: lastSet?.weight ?? null,
        completed: false,
        breakTime: lastRest,
      };
      const newSets = [...exercise.sets, newSet].map((s, i) => ({
        ...s,
        setNumber: i + 1,
      }));
      updateExerciseSets(exerciseId, newSets);

      if (lastRest > 0) {
        updateAppData(userId, (d) => ({
          ...d,
          preferred_rest_sec: lastRest,
        }));
      }
      setFocusSetKey(`${exerciseId}-${newSets.length - 1}-reps`);
    },
    [workouts, preferredRestSec, updateExerciseSets, userId]
  );

  const removeSetFromExercise = useCallback(
    (exerciseId: number, setIndex: number) => {
      const exercise = workouts.find((e) => e.id === exerciseId);
      if (!exercise?.sets || exercise.sets.length <= 1) return;
      const newSets = exercise.sets
        .filter((_, i) => i !== setIndex)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));
      updateExerciseSets(exerciseId, newSets);
    },
    [workouts, updateExerciseSets]
  );

  const updateSetField = useCallback(
    (exerciseId: number, setIndex: number, field: "reps" | "weight", value: number | null) => {
      const exercise = workouts.find((e) => e.id === exerciseId);
      if (!exercise?.sets?.[setIndex]) return;
      const newSets = exercise.sets.map((s, i) =>
        i === setIndex ? { ...s, [field]: value } : s
      );
      updateExerciseSets(exerciseId, newSets);
    },
    [workouts, updateExerciseSets]
  );

  const updateSetRest = useCallback(
    (exerciseId: number, setIndex: number, sec: number) => {
      const exercise = workouts.find((e) => e.id === exerciseId);
      if (!exercise?.sets?.[setIndex]) return;
      const newSets = exercise.sets.map((s, i) =>
        i === setIndex ? { ...s, breakTime: sec } : s
      );
      updateExerciseSets(exerciseId, newSets);
      if (sec > 0) {
        updateAppData(userId, (d) => ({ ...d, preferred_rest_sec: sec }));
      }
    },
    [workouts, updateExerciseSets, userId]
  );

  const resetDayProgress = useCallback(() => {
    const currentWorkouts = appData ? deriveDayWorkouts(appData, currentDayIndex) : [];
    const updatedWorkouts = currentWorkouts.map((exercise) => {
      if (!exercise.sets) return exercise;
      const resetSets = exercise.sets.map((set) => ({ ...set, completed: false }));
      return { ...exercise, sets: resetSets, completed: false };
    });
    saveDayWorkouts(updatedWorkouts);
  }, [appData, currentDayIndex, saveDayWorkouts]);

  const completeWorkout = useCallback(() => {
    if (workouts.length === 0) {
      showToast("Add at least one exercise before completing the workout", "error");
      return;
    }

    const workoutEntry = {
      date: formatDateKey(new Date()),
      timestamp: Date.now(),
      dayOfWeek: currentDayIndex,
      workoutType: workoutSchedule[currentDayIndex],
      exercises: [...workouts],
    };

    // 1) Update history and reset day progress in one patch (instant UI)
    updateAppData(userId, (current) => {
      const nextHistory = [...current.workoutHistory, workoutEntry];
      const nextSaved = current.savedWorkouts.map((day, dayIdx) => {
        if (dayIdx !== currentDayIndex) return day;
        return (day as Exercise[]).map((ex) =>
          ex.sets
            ? { ...ex, sets: ex.sets.map((s) => ({ ...s, completed: false })), completed: false }
            : ex
        );
      });
      return { ...current, workoutHistory: nextHistory, savedWorkouts: nextSaved };
    });

    // 2) Best-effort flush so sync runs before user leaves
    flushWorkoutData(userId);

    // 3) Sync to feed in background (fire-and-forget)
    const totalReps = workouts.reduce(
      (sum, ex) => sum + (ex.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0),
      0
    );
    const totalSets = workouts.reduce((sum, ex) => sum + (ex.sets?.length ?? 0), 0);
    const weightedSum = workouts.reduce(
      (sum, ex) => sum + (ex.sets?.reduce((s, set) => s + (set.weight ?? 0), 0) ?? 0),
      0
    );
    const weightedCount = workouts.reduce(
      (sum, ex) =>
        sum +
        (ex.sets?.reduce((s, set) => s + (set.weight != null ? 1 : 0), 0) ?? 0),
      0
    );
    const avgWeight = weightedCount > 0 ? Math.round(weightedSum / weightedCount) : null;
    const exerciseDetails = workouts.map((ex) => ({
      name: sanitizeExerciseDisplayText(ex.name) || "Exercise",
      sets: (ex.sets ?? []).map((s) => ({ r: s.reps ?? 0, w: s.weight, done: s.completed })),
    }));
    insertLog(userId, {
      date: workoutEntry.date,
      workout_type:
        sanitizeExerciseDisplayText(workoutEntry.workoutType || "workout")
          .toLowerCase()
          .replace(/\s+/g, "_") || "workout",
      workout_name: sanitizeExerciseDisplayText(workoutEntry.workoutType || "Workout"),
      reps: totalReps > 0 ? totalReps : null,
      sets: totalSets > 0 ? totalSets : null,
      lbs: avgWeight,
      duration_min: undefined,
      notes: JSON.stringify(exerciseDetails),
    }).catch((err) => console.warn("Failed to sync completed workout to feed", err));

    showToast("Workout completed and saved to history!", "success");
    const rotationLength =
      settingsProp?.tracking_style === "sequence" && settingsProp?.rotation?.length
        ? settingsProp.rotation.length
        : 0;
    if (rotationLength > 0) {
      justAdvancedAfterCompleteRef.current = true;
      setCurrentDayIndex((currentDayIndex + 1) % rotationLength);
    } else {
      setCurrentDayIndex(new Date().getDay());
    }
  }, [
    workouts,
    currentDayIndex,
    workoutSchedule,
    userId,
    showToast,
    settingsProp?.tracking_style,
    settingsProp?.rotation?.length,
  ]);

  const navigateDay = (direction: "prev" | "next") => {
    const sequenceLabelsLocal =
      settingsProp?.tracking_style === "sequence" &&
      settingsProp?.rotation?.length
        ? settingsProp.rotation.map(
            (r) => r.label ?? `Day ${(r.index ?? 0) + 1}`
          )
        : trackingStyle === "inconsistent" && rotationOrder.length > 0
          ? rotationOrder
          : null;
    const maxIndex =
      sequenceLabelsLocal && sequenceLabelsLocal.length > 0
        ? sequenceLabelsLocal.length - 1
        : 6;
    if (direction === "prev") {
      setCurrentDayIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    } else {
      setCurrentDayIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const toggleCollapse = (exerciseId: number) => {
    setCollapsedExercises((prev) => {
      const next = new globalThis.Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const sequenceLabels =
    settingsProp?.tracking_style === "sequence" &&
    settingsProp?.rotation?.length
      ? settingsProp.rotation.map(
          (r) => r.label ?? `Day ${(r.index ?? 0) + 1}`
        )
      : trackingStyle === "inconsistent" && rotationOrder.length > 0
        ? rotationOrder
        : null;
  const isInconsistent = !!sequenceLabels;
  const navigatorLabels = isInconsistent ? sequenceLabels : days;
  const totalSequenceWorkouts = workoutHistory.length;
  const currentSequenceSlot = isInconsistent
    ? totalSequenceWorkouts % Math.max(1, navigatorLabels.length)
    : 0;
  const isToday = isInconsistent
    ? currentDayIndex === currentSequenceSlot
    : currentDayIndex === new Date().getDay();
  const getDateLabel = () => {
    if (isInconsistent && navigatorLabels[currentDayIndex]) {
      return navigatorLabels[currentDayIndex];
    }
    return days[currentDayIndex] ?? "Today";
  };

  // Summary stats for current day
  const totalExercises = workouts.length;
  const totalSetsCount = workouts.reduce(
    (sum, ex) => sum + (ex.sets?.length ?? 0),
    0
  );
  const totalRepsCount = workouts.reduce(
    (sum, ex) =>
      sum + (ex.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0),
    0
  );

  useEffect(() => {
    if (isInconsistent && justAdvancedAfterCompleteRef.current) {
      justAdvancedAfterCompleteRef.current = false;
      return;
    }
    const maxIndex = Math.max(0, navigatorLabels.length - 1);
    if (isInconsistent) {
      const slot =
        totalSequenceWorkouts % Math.max(1, navigatorLabels.length);
      setCurrentDayIndex(Math.min(slot, maxIndex));
    } else {
      setCurrentDayIndex((prev) => (prev > maxIndex ? 0 : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigatorLabels.length, totalSequenceWorkouts, isInconsistent]);

  return (
    <div className="mx-auto w-full max-w-lg pb-24">
      {/* Break Timer Display */}
      {activeBreakTimer && (
        <AnimatePresence>
          <motion.div
            key="break-timer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg)]/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 250,
              }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-6 text-center shadow-xl"
            >
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--ice)]">
                Break time
              </div>
              <div className="mb-2 text-4xl font-bold text-[var(--text)]">
                {formatTime(activeBreakTimer.timeLeft)}
              </div>
              <p className="mb-5 text-sm text-[var(--textMuted)]">
                Rest before your next set.
              </p>
              <button
                type="button"
                onClick={() => setActiveBreakTimer(null)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg3)] py-3 font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/50"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sticky Day Navigator */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 rounded-b-2xl border-b border-white/10 bg-[var(--bg)]/50 px-4 pb-2 pt-1 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="flex items-center justify-between py-1.5">
          <button
            type="button"
            onClick={() => navigateDay("prev")}
            className="rounded-xl p-2 text-[var(--textMuted)] transition-colors hover:bg-white/10 hover:text-[var(--text)] active:scale-95"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--text)]">
              {getDateLabel()}
            </p>
            {isToday && (
              <p className="text-[10px] font-medium text-[var(--ice)]">
                Today
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigateDay("next")}
            className="rounded-xl p-2 text-[var(--textMuted)] transition-colors hover:bg-white/10 hover:text-[var(--text)] active:scale-95"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {/* Summary line */}
        {totalExercises > 0 && (
          <p className="text-center text-[11px] text-[var(--textMuted)] pb-0.5">
            {totalExercises} exercise{totalExercises !== 1 ? "s" : ""} ·{" "}
            {totalSetsCount} sets · {totalRepsCount} reps
          </p>
        )}
      </div>

      {/* Exercise List */}
      <div className="mb-6">
        {workouts.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 py-10 text-center">
            <Dumbbell className="mx-auto mb-2 h-8 w-8 text-[var(--textMuted)] opacity-40" />
            <p className="text-sm text-[var(--textMuted)]">
              No exercises yet.
            </p>
            <p className="mt-1 text-xs text-[var(--textMuted)]">
              Tap &quot;+ Add Exercise&quot; below to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {workouts.map((exercise) => {
                const isCollapsed = collapsedExercises.has(exercise.id);
                // Always show weight column so user can fill it in (even for new/blank exercises)
                const exerciseHasWeight = true;

                return (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 overflow-hidden"
                  >
                    {/* Exercise header: name + category + ⋯ menu */}
                    <div className="flex items-center gap-2 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(exercise.id)}
                        className="shrink-0 rounded-lg p-0.5 text-[var(--textMuted)] transition-transform hover:text-[var(--text)]"
                        aria-label={
                          isCollapsed ? "Expand exercise" : "Collapse exercise"
                        }
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-medium text-[var(--text)]">
                          {sanitizeExerciseDisplayText(exercise.name) ||
                            "Exercise"}
                        </h3>
                        <span className="mt-0.5 inline-block rounded border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-0.5 text-[10px] text-[var(--textMuted)]">
                          {exercise.categories &&
                          exercise.categories.length > 0
                            ? exercise.categories
                                .map(
                                  (cat) =>
                                    ALL_CATEGORIES.find(
                                      (c) => c.value === cat
                                    )?.label || cat
                                )
                                .join(", ")
                            : "Uncategorized"}
                        </span>
                      </div>

                      {/* ⋯ More menu */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === exercise.id ? null : exercise.id
                            );
                          }}
                          className="rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-[var(--bg3)] hover:text-[var(--text)]"
                          aria-label="Exercise options"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {/* Dropdown */}
                        <AnimatePresence>
                          {openMenuId === exercise.id && (
                            <>
                              {/* Click-away backdrop */}
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] shadow-xl"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setEditingExercise(exercise);
                                    setShowModal(true);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg3)]/60"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-[var(--textMuted)]" />
                                  Edit exercise
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    markAllDone(exercise.id);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg3)]/60"
                                >
                                  <Check className="h-3.5 w-3.5 text-[var(--textMuted)]" />
                                  Mark all done
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (!appData) return;
                                    const allWorkouts = appData.savedWorkouts.flat() as Exercise[];
                                    const workoutMap = new Map<number, Exercise>();
                                    allWorkouts.forEach((w) => {
                                      if (!workoutMap.has(w.id)) workoutMap.set(w.id, w);
                                    });
                                    const exToReset = workoutMap.get(exercise.id);
                                    if (exToReset?.sets) {
                                      workoutMap.set(exercise.id, {
                                        ...exToReset,
                                        sets: exToReset.sets.map((s) => ({ ...s, completed: false })),
                                      });
                                    }
                                    saveDayWorkouts(Array.from(workoutMap.values()));
                                    showToast("Checks reset", "info", 2000);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg3)]/60"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-[var(--textMuted)]" />
                                  Reset checks
                                </button>
                                <div className="border-t border-[var(--border)]" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (
                                      window.confirm(
                                        `Delete "${sanitizeExerciseDisplayText(exercise.name)}"? This cannot be undone.`
                                      )
                                    ) {
                                      removeExercise(exercise.id);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete exercise
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Collapsible body */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {exercise.sets && exercise.sets.length > 0 && (
                            <div className="border-t border-[var(--border)] px-2 py-2">
                              {/* Column headers */}
                              <div
                                className={`mb-1 grid items-end gap-1.5 px-2 text-[10px] font-medium uppercase tracking-wide text-[var(--textMuted)] ${
                                  exerciseHasWeight
                                    ? "grid-cols-[2rem_1fr_1fr_1fr_2.5rem]"
                                    : "grid-cols-[2rem_1fr_1fr_2.5rem]"
                                }`}
                              >
                                <span className="text-center">Set</span>
                                <span>Reps</span>
                                {exerciseHasWeight && <span>Weight</span>}
                                <span>Rest</span>
                                <span className="text-center">Done</span>
                              </div>

                              <div className="space-y-0.5">
                                {exercise.sets.map((set, index) => (
                                  <SetRowCard
                                    key={`${exercise.id}-${index}`}
                                    set={set}
                                    showWeightColumn={!!exerciseHasWeight}
                                    repsRef={{
                                      current:
                                        setRepsRefs.current.get(
                                          `${exercise.id}-${index}-reps`
                                        ) ?? null,
                                    }}
                                    onRepsBlur={(v) =>
                                      updateSetField(
                                        exercise.id,
                                        index,
                                        "reps",
                                        v
                                      )
                                    }
                                    onWeightBlur={(v) =>
                                      updateSetField(
                                        exercise.id,
                                        index,
                                        "weight",
                                        v
                                      )
                                    }
                                    onRestChange={(sec) =>
                                      updateSetRest(
                                        exercise.id,
                                        index,
                                        sec
                                      )
                                    }
                                    onToggleComplete={() =>
                                      toggleSetComplete(
                                        exercise.id,
                                        index,
                                        set.breakTime
                                      )
                                    }
                                    onFieldKeyDown={(e, field) => {
                                      if (
                                        field === "rest" &&
                                        e.key === "Enter"
                                      ) {
                                        const nextKey = `${exercise.id}-${index + 1}-reps`;
                                        const nextRef =
                                          setRepsRefs.current.get(nextKey);
                                        if (nextRef) nextRef.focus();
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Set */}
                          <div className="border-t border-[var(--border)] px-4 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                addSetToExercise(exercise.id)
                              }
                              className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg3)]/40 px-3 py-1.5 text-xs font-medium text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/40 hover:text-[var(--ice)]"
                            >
                              <Plus className="h-3 w-3" />
                              Add set
                            </button>
                          </div>

                          {exercise.notes && (
                            <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--textMuted)]">
                              {sanitizeExerciseDisplayText(exercise.notes)}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Undo toast for Mark All Done */}
      <AnimatePresence>
        {undoData && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={undoMarkAllDone}
              className="rounded-xl border border-[var(--ice)]/40 bg-[var(--bg2)] px-4 py-2.5 text-sm font-medium text-[var(--ice)] shadow-lg backdrop-blur-sm transition-colors hover:bg-[var(--iceSoft)]"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-dismiss undo after 5 seconds */}
      {undoData && (
        <UndoAutoDissmiss onExpire={() => setUndoData(null)} />
      )}

      {/* Sticky Bottom Bar: Add Exercise + Finish */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setEditingExercise(null);
              setShowModal(true);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)] px-4 py-3 text-sm font-semibold text-[var(--ice)] transition-colors hover:border-[var(--ice)]"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </motion.button>
          {workouts.length > 0 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={completeWorkout}
              className="rounded-xl border border-[var(--ice)] bg-[var(--ice)] px-5 py-3 text-sm font-semibold text-[var(--bg)] transition-opacity hover:opacity-90"
            >
              Finish
            </motion.button>
          )}
        </div>
      </div>

      {/* Exercise Modal */}
      <ExerciseModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExercise(null);
        }}
        onSave={addExercise}
        editingExercise={editingExercise}
        currentDayIndex={currentDayIndex}
        dayLabels={
          sequenceLabels && sequenceLabels.length > 0
            ? sequenceLabels
            : undefined
        }
        modes={settingsProp?.modes}
        defaultBreakTime={settingsProp?.preferences?.timer_default_sec ?? 0}
        onBreakTimeChange={(sec) => {
          updateAppData(userId, (d) => ({
            ...d,
            preferred_rest_sec: sec,
          }));
        }}
        userId={userId}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Undo auto-dismiss timer
// ─────────────────────────────────────────────

function UndoAutoDissmiss({ onExpire }: { onExpire: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onExpire, 5000);
    return () => clearTimeout(timer);
  }, [onExpire]);
  return null;
}

// ─────────────────────────────────────────────
// Exercise Modal (Add / Edit)
// ─────────────────────────────────────────────

function defaultSetRows(restSec: number): SetRow[] {
  return [
    { reps: null, weight: null, restSec },
    { reps: null, weight: null, restSec },
    { reps: null, weight: null, restSec },
  ];
}

interface ExerciseModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  editingExercise: Exercise | null;
  currentDayIndex: number;
  dayLabels?: string[];
  modes?: {
    progressiveOverload?: boolean;
    dropSets?: boolean;
    rpe?: boolean;
  };
  defaultBreakTime?: number;
  onBreakTimeChange?: (sec: number) => void;
  userId: string;
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ExerciseModal = ({
  show,
  onClose,
  onSave,
  editingExercise,
  currentDayIndex,
  dayLabels,
  modes,
  defaultBreakTime = 0,
  onBreakTimeChange,
  userId,
}: ExerciseModalProps) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    ExerciseCategory[]
  >([]);
  const [setRows, setSetRows] = useState<SetRow[]>(() =>
    defaultSetRows(defaultBreakTime)
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([
    currentDayIndex,
  ]);
  const [notes, setNotes] = useState("");
  const [isSavingExercise, setIsSavingExercise] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>(
    []
  );
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const clickingCategoryRef = useRef(false);

  useEffect(() => {
    if (!show || !name.trim() || !modes?.progressiveOverload || !userId) {
      setLastWeight(null);
      return;
    }
    let cancelled = false;
    loadAppData(userId).then((data) => {
      if (cancelled) return;
      const history = data.workoutHistory ?? [];
      const searchName = name.trim().toLowerCase();
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        const exercises =
          (entry as { exercises?: unknown[] }).exercises ?? [];
        for (const ex of exercises) {
          const e = ex as {
            name?: string;
            sets?: { weight?: number | null }[];
          };
          if (
            e.name?.trim().toLowerCase() === searchName &&
            e.sets?.length
          ) {
            let maxW = 0;
            for (const s of e.sets) {
              const w = s.weight;
              if (w != null && w > maxW) maxW = w;
            }
            if (maxW > 0) {
              setLastWeight(maxW);
              return;
            }
          }
        }
      }
      setLastWeight(null);
    });
    return () => {
      cancelled = true;
    };
  }, [show, name, modes?.progressiveOverload, userId]);

  const mdDays =
    dayLabels && dayLabels.length > 0 ? dayLabels : WEEKDAY_LABELS;
  const isWeekdayMode = !dayLabels?.length;

  // Exercise database
  const exerciseDatabase: Record<ExerciseCategory, string[]> = {
    chest: [
      "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Press",
      "Incline Dumbbell Press", "Decline Dumbbell Press", "Cable Fly", "Pec Deck Machine",
      "Push-ups", "Dips", "Chest Press Machine", "Smith Machine Bench Press",
      "Chest Fly Machine", "Pec Deck", "Cable Crossover", "Dumbbell Flyes",
    ],
    back: [
      "Pull-ups", "Lat Pulldown", "Barbell Row", "Dumbbell Row", "Cable Row",
      "Seated Row Machine", "T-Bar Row", "Bent Over Row", "One-Arm Row",
      "Wide Grip Pulldown", "Close Grip Pulldown", "Reverse Grip Pulldown",
      "Reverse Fly", "Face Pull", "Shrugs", "Deadlift",
    ],
    shoulders: [
      "Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Front Raise",
      "Rear Delt Fly", "Arnold Press", "Cable Lateral Raise", "Face Pull",
      "Upright Row", "Shoulder Press Machine", "Pike Push-ups",
      "Smith Machine Shoulder Press", "Reverse Pec Deck", "Rear Delt Machine",
    ],
    legs: [
      "Squats", "Leg Press", "Leg Extension", "Leg Curl", "Romanian Deadlift",
      "Bulgarian Split Squat", "Lunges", "Walking Lunges", "Calf Raises",
      "Hack Squat", "Smith Machine Squat", "Goblet Squat", "Step-ups",
      "Hip Thrust", "Hip Abductor Machine", "Hip Adductor Machine",
    ],
    arms: [
      "Bicep Curl", "Hammer Curl", "Tricep Extension", "Tricep Dips",
      "Cable Curl", "Preacher Curl", "Concentration Curl", "Overhead Tricep Extension",
      "Close Grip Bench Press", "Skull Crushers", "Cable Tricep Pushdown",
      "Barbell Curl", "Dumbbell Curl", "Tricep Kickback", "Rope Cable Curl",
    ],
    core: [
      "Plank", "Crunches", "Sit-ups", "Russian Twists", "Leg Raises",
      "Mountain Climbers", "Bicycle Crunches", "Dead Bug", "Hollow Hold",
      "Ab Wheel", "Cable Crunch", "Hanging Leg Raise", "Side Plank",
      "Reverse Crunch", "Flutter Kicks", "V-Ups",
    ],
    cardio: [
      "Running", "Treadmill", "Elliptical", "Bike", "Rowing Machine",
      "Stair Climber", "Jump Rope", "Burpees", "High Knees", "Jumping Jacks",
      "Boxing", "Swimming", "Cycling", "HIIT", "Sprint Intervals",
    ],
    full_body: [
      "Burpees", "Thrusters", "Clean and Press", "Kettlebell Swing",
      "Turkish Get-up", "Man Makers", "Bear Crawl", "Mountain Climbers",
      "Jump Squats", "Box Jumps", "Battle Ropes", "Sled Push",
      "Farmers Walk", "Circuit Training",
    ],
  };

  useEffect(() => {
    if (name.trim().length > 0) {
      const searchTerm = name.toLowerCase();
      const allExercises =
        selectedCategories.length > 0
          ? selectedCategories.flatMap(
              (cat) => exerciseDatabase[cat] || []
            )
          : Object.values(exerciseDatabase).flat();

      const filtered = allExercises
        .filter((ex) => ex.toLowerCase().includes(searchTerm))
        .slice(0, 8);

      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, selectedCategories]);

  useEffect(() => {
    if (editingExercise) {
      setName(editingExercise.name);
      if (
        editingExercise.categories &&
        editingExercise.categories.length > 0
      ) {
        setSelectedCategories(editingExercise.categories);
      } else if ((editingExercise as any).category) {
        setSelectedCategories([(editingExercise as any).category]);
      } else {
        setSelectedCategories([]);
      }
      if (editingExercise.sets && editingExercise.sets.length > 0) {
        setSetRows(
          editingExercise.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight ?? null,
            restSec: s.breakTime ?? 0,
            rpe: (s as Set).rpe ?? null,
            isDropSet: (s as Set).isDropSet ?? false,
          }))
        );
      } else {
        setSetRows(defaultSetRows(defaultBreakTime));
      }
      setSelectedDays(
        editingExercise.selectedDays || [currentDayIndex]
      );
      setNotes(editingExercise.notes || "");
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingExercise, show, currentDayIndex]);

  const resetForm = () => {
    setName("");
    setSelectedCategories([]);
    setSetRows(defaultSetRows(defaultBreakTime));
    setSelectedDays([currentDayIndex]);
    setNotes("");
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const addSetRow = () => {
    setSetRows((prev) => {
      const lastRow = prev[prev.length - 1];
      return [
        ...prev,
        {
          reps: lastRow?.reps ?? null,
          weight: lastRow?.weight ?? null,
          restSec: lastRow?.restSec ?? defaultBreakTime,
          rpe: lastRow?.rpe ?? null,
          isDropSet: false,
        },
      ];
    });
  };
  const addDropSetRow = () => {
    const last = setRows[setRows.length - 1];
    const lastW = last?.weight ?? null;
    const lastR = last?.reps ?? null;
    const dropWeight =
      lastW != null && lastW > 0
        ? Math.round(lastW * 0.8 * 2) / 2
        : null;
    setSetRows((prev) => [
      ...prev,
      {
        reps: lastR,
        weight: dropWeight,
        restSec: defaultBreakTime,
        rpe: null,
        isDropSet: true,
      },
    ]);
  };
  const removeSetRow = (index: number) => {
    setSetRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };
  const updateSetRow = (
    index: number,
    field: "reps" | "weight" | "restSec" | "rpe",
    value: number | null
  ) => {
    setSetRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
    if (field === "restSec" && typeof value === "number" && value > 0)
      onBreakTimeChange?.(value);
  };

  const toggleCategory = (category: ExerciseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (isSavingExercise) return;

    if (!name.trim()) {
      showToast("Please enter an exercise name", "error");
      return;
    }
    if (selectedCategories.length === 0) {
      showToast("Please select at least one category", "error");
      return;
    }

    setIsSavingExercise(true);

    try {
      const exercise: Exercise = {
        id: editingExercise?.id || Date.now(),
        name: name.trim(),
        categories:
          selectedCategories.length > 0 ? selectedCategories : [],
        notes: notes.trim() || undefined,
        completed: false,
        selectedDays:
          selectedDays.length > 0 ? selectedDays : undefined,
        sets: setRows.map((row, i) => ({
          setNumber: i + 1,
          reps: row.reps ?? 0,
          weight: row.weight,
          completed: false,
          breakTime: row.restSec > 0 ? row.restSec : undefined,
          rpe:
            modes?.rpe && row.rpe != null ? row.rpe : undefined,
          isDropSet: row.isDropSet === true,
        })),
      };

      const savePromise = Promise.resolve(onSave(exercise));
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error saving exercise:", error);
      showToast("Failed to save exercise. Please try again.", "error");
    } finally {
      setIsSavingExercise(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[var(--bg)]/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 grid place-items-center p-4"
          >
            <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-5 shadow-xl lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-[var(--text)]">
                    {editingExercise ? "Edit Exercise" : "Add Exercise"}
                  </h3>
                  <p className="text-xs text-[var(--textMuted)]">
                    {editingExercise
                      ? "Update exercise details"
                      : "Create a new exercise"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-[var(--textMuted)] hover:bg-[var(--bg3)] hover:text-[var(--text)]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 space-y-3">
                <div className="relative">
                  <label className="mb-1 block text-xs text-[var(--textMuted)]">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      setIsNameFocused(true);
                      if (name.trim().length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setIsNameFocused(false);
                      setShowSuggestions(false);
                      clickingCategoryRef.current = false;
                    }}
                    placeholder="Start typing to see suggestions..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg3)]/80 px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                  />
                  {showSuggestions &&
                    filteredSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg2)] shadow-xl">
                        {filteredSuggestions.map(
                          (suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) =>
                                e.preventDefault()
                              }
                              onClick={() => {
                                setName(suggestion);
                                setShowSuggestions(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg3)]"
                            >
                              {suggestion}
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[var(--textMuted)]">
                    Categories (Select Multiple)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clickingCategoryRef.current = true;
                          setShowSuggestions(false);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCategory(cat.value);
                          clickingCategoryRef.current = false;
                        }}
                        className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          selectedCategories.includes(cat.value)
                            ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
                            : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:border-[var(--ice)]/40"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {selectedCategories.length === 0 && (
                    <p className="mt-1.5 text-xs text-[var(--textMuted)]">
                      Please select at least one category
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-[var(--textMuted)]">
                    {isWeekdayMode
                      ? "Which day(s)?"
                      : "Which workout day(s)?"}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {mdDays.map((day, index) => (
                      <button
                        key={`${day}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedDays((prev) =>
                            prev.includes(index)
                              ? prev.filter((d) => d !== index)
                              : [...prev, index]
                          );
                        }}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                          selectedDays.includes(index)
                            ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
                            : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:border-[var(--ice)]/40"
                        }`}
                      >
                        {isWeekdayMode
                          ? day.substring(0, 3)
                          : day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs text-[var(--textMuted)]">
                      Sets
                    </label>
                    <div className="flex gap-3">
                      {modes?.dropSets && (
                        <button
                          type="button"
                          onClick={addDropSetRow}
                          className="text-xs font-medium text-[var(--ice)] hover:underline"
                        >
                          + Drop set
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addSetRow}
                        className="text-xs font-medium text-[var(--ice)] hover:underline"
                      >
                        + Add set
                      </button>
                    </div>
                  </div>

                  {/* Column headers */}
                  <div
                    className="mb-1 grid items-end gap-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-[var(--textMuted)]"
                    style={{
                      gridTemplateColumns: `1.5rem 1fr 1fr 1fr${modes?.rpe ? " 2rem" : ""} 1.25rem`,
                    }}
                  >
                    <span></span>
                    <span>Reps</span>
                    <span>Weight</span>
                    <span>Rest</span>
                    {modes?.rpe && <span>RPE</span>}
                    <span></span>
                  </div>

                  <div className="space-y-1.5">
                    {setRows.map((row, index) => (
                      <div
                        key={index}
                        className={`grid items-center gap-1.5 rounded-lg border px-1.5 py-1.5 ${
                          row.isDropSet
                            ? "border-[var(--ice)]/40 bg-[var(--iceSoft)]/20"
                            : "border-[var(--border)] bg-[var(--bg3)]/40"
                        }`}
                        style={{
                          gridTemplateColumns: `1.5rem 1fr 1fr 1fr${modes?.rpe ? " 2rem" : ""} 1.25rem`,
                        }}
                      >
                        <span className="text-center text-[11px] font-medium text-[var(--textMuted)]">
                          {row.isDropSet ? "D" : index + 1}
                        </span>

                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={
                            row.reps != null
                              ? String(row.reps)
                              : ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSetRow(
                              index,
                              "reps",
                              v === ""
                                ? null
                                : parseInt(v, 10) || 0
                            );
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1.5 py-1 text-center text-xs text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
                        />

                        <input
                          type="number"
                          min="0"
                          step="2.5"
                          placeholder={
                            modes?.progressiveOverload &&
                            lastWeight
                              ? String(lastWeight)
                              : "—"
                          }
                          value={
                            row.weight != null
                              ? String(row.weight)
                              : ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSetRow(
                              index,
                              "weight",
                              v === ""
                                ? null
                                : parseFloat(v) || 0
                            );
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1.5 py-1 text-center text-xs text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
                        />

                        <div className="flex items-center gap-0.5">
                          <input
                            type="number"
                            min="0"
                            aria-label="Rest seconds"
                            value={
                              row.restSec > 0
                                ? String(row.restSec)
                                : ""
                            }
                            onChange={(e) =>
                              updateSetRow(
                                index,
                                "restSec",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="—"
                            className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1.5 py-1 text-center text-xs text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
                          />
                          <span className="shrink-0 text-[9px] text-[var(--textMuted)]">
                            s
                          </span>
                        </div>

                        {modes?.rpe && (
                          <input
                            type="number"
                            min={1}
                            max={10}
                            aria-label="RPE 1-10"
                            value={row.rpe ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateSetRow(
                                index,
                                "rpe",
                                v === ""
                                  ? null
                                  : Math.min(
                                      10,
                                      Math.max(
                                        1,
                                        parseInt(v, 10) || 0
                                      )
                                    )
                              );
                            }}
                            onFocus={(e) => e.target.select()}
                            placeholder="—"
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1 py-1 text-center text-xs text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeSetRow(index)}
                          disabled={setRows.length <= 1}
                          className="mx-auto rounded p-0.5 text-[var(--textMuted)] hover:text-[var(--text)] disabled:opacity-30"
                          aria-label="Remove set"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {modes?.progressiveOverload &&
                    lastWeight != null &&
                    lastWeight > 0 && (
                      <p className="mt-1 text-[10px] text-[var(--textMuted)]">
                        Last weight: {lastWeight} lb
                      </p>
                    )}
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[var(--textMuted)]">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    className="min-h-[60px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg3)]/80 px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/80 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSavingExercise}
                  className="flex-1 rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)] py-2.5 text-sm font-semibold text-[var(--ice)] transition-colors hover:border-[var(--ice)] disabled:opacity-60"
                >
                  {isSavingExercise
                    ? "Saving..."
                    : editingExercise
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
