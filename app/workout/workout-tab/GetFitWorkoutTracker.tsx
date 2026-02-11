"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, Pencil, Trash2, X, Dumbbell, Target, Sparkles } from "lucide-react";
import { loadAppData, updateAppData } from "./getfit/dataStore";
import { formatDateKey, sanitizeExerciseDisplayText, getWorkoutsCompletedThisWeek, type TrackingStyle } from "./getfit/storage";
import { getDefaultWorkoutRoutine, getDefaultWorkoutSchedule } from "./getfit/workoutRoutine";
import { getWorkoutSettings, getUserTemplates, insertLog, type WorkoutSettings } from "@/lib/supabase/workout";

interface Set {
  setNumber: number;
  reps: number;
  weight: number | null; // null = no weight (hidden)
  completed: boolean;
  breakTime?: number; // Rest/break in seconds per set (0 = off)
  rpe?: number | null; // 1-10 when RPE tracking enabled
  isDropSet?: boolean;
}

type ExerciseCategory = "legs" | "arms" | "chest" | "back" | "shoulders" | "core" | "cardio" | "full_body";

/** Format weight for display: 0 or null/undefined → "No weight", else "N lb". */
function formatWeight(weight: number | null | undefined): string {
  if (weight == null || weight === 0) return "No weight";
  return `${weight} lb`;
}

/** Shared category list for Add Exercise modal in all modes (scheduled / inconsistent / etc.). */
const ALL_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "legs", label: "Legs" },
  { value: "arms", label: "Arms" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Full Body" },
];

interface Exercise {
  id: number;
  name: string;
  categories: ExerciseCategory[]; // Multiple categories allowed
  sets?: Set[];
  selectedDays?: number[]; // Days of week (0-6) where this exercise appears
  notes?: string;
  completed?: boolean;
}

function SetRowCard({
  set,
  canRemove,
  onRepsBlur,
  onWeightBlur,
  onRestChange,
  onToggleComplete,
  onRemove,
}: {
  set: Set;
  exerciseId: number;
  index: number;
  canRemove: boolean;
  onRepsBlur: (v: number) => void;
  onWeightBlur: (v: number | null) => void;
  onRestChange: (sec: number) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}) {
  const [repsInput, setRepsInput] = useState(String(set.reps ?? ""));
  const [weightInput, setWeightInput] = useState(set.weight != null ? String(set.weight) : "");
  const [restInput, setRestInput] = useState(String(set.breakTime ?? 0));

  useEffect(() => {
    setRepsInput(String(set.reps ?? ""));
    setWeightInput(set.weight != null ? String(set.weight) : "");
    setRestInput(String(set.breakTime ?? 0));
  }, [set.reps, set.weight, set.breakTime]);

  const restSec = Math.max(0, parseInt(restInput, 10) || 0);

  return (
    <div className="grid grid-cols-[2.25rem_1fr_1fr_1fr_auto] items-center gap-2 border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-center text-xs text-[var(--textMuted)]">{set.setNumber}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          aria-label={`Set ${set.setNumber} reps`}
          value={repsInput}
          onChange={(e) => setRepsInput(e.target.value)}
          onBlur={() => onRepsBlur(parseInt(repsInput, 10) || 0)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-1 text-center text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
        />
        <span className="text-[11px] text-[var(--textMuted)]">reps</span>
      </div>

      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          step="2.5"
          aria-label={`Set ${set.setNumber} weight`}
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          onBlur={() => {
            const v = weightInput.trim();
            onWeightBlur(v === "" ? null : parseFloat(v) || 0);
          }}
          placeholder="0"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-1 text-center text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
        />
        <span className="text-[11px] text-[var(--textMuted)]">lb</span>
      </div>

      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          aria-label="Rest seconds"
          value={restInput}
          onChange={(e) => setRestInput(e.target.value)}
          onBlur={() => onRestChange(restSec)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-1 text-center text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
        />
        <span className="text-[11px] text-[var(--textMuted)]">s</span>
      </div>

      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-colors ${
            set.completed
              ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
              : "border-[var(--border)] bg-transparent text-[var(--textMuted)] hover:border-[var(--ice)]/50"
          }`}
          aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
        >
          {set.completed && <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-lg p-1 text-[var(--textMuted)] hover:bg-[var(--bg3)] hover:text-[var(--text)] disabled:opacity-40"
          aria-label="Remove set"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function GetFitWorkoutTracker({
  userId,
  settings: settingsProp,
}: {
  userId: string;
  settings: WorkoutSettings;
}) {
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay());
  const [workouts, setWorkouts] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [activeBreakTimer, setActiveBreakTimer] = useState<{ exerciseId: number; setIndex: number; timeLeft: number } | null>(null);
  const [workoutSchedule, setWorkoutSchedule] = useState<string[]>(
    Array(7).fill("Rest Day")
  );
  const [trackingStyle, setTrackingStyle] = useState<TrackingStyle>("scheduled");
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [rotationOrder, setRotationOrder] = useState<string[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<{ date: string; timestamp: number; dayOfWeek: number; workoutType?: string; exercises: unknown[] }[]>([]);
  const [preferredRestSec, setPreferredRestSec] = useState(() => {
    // Seed from Supabase settings so the very first Add Exercise gets the right default
    if (settingsProp?.preferences?.timer_enabled && settingsProp.preferences.timer_default_sec) {
      return settingsProp.preferences.timer_default_sec;
    }
    return 0;
  });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadWorkoutSchedule();
      await loadDayWorkouts();
      // Hydrate from Supabase if localStorage is empty (user just completed the single SetupWizard)
      const data = await loadAppData(userId);
      const isDefaultSchedule =
        !data.workoutSetupComplete &&
        (data.workoutSchedule?.length === 7 && data.workoutSchedule.every((d) => d === "Rest Day"));
      if (cancelled || !isDefaultSchedule) return;
      try {
        const settings = await getWorkoutSettings(userId);
        if (!settings?.setup_completed) return;
        const schedule: string[] = Array(7).fill("Rest Day");
        let rotationOrder: string[] = [];

        if (settings.tracking_style === "schedule") {
          if (settings.schedule_map) {
            const templates = await getUserTemplates(userId);
            for (let day = 0; day < 7; day++) {
              const templateId = settings.schedule_map![String(day)];
              const name = templateId ? templates.find((t) => t.id === templateId)?.name : null;
              if (name) schedule[day] = name;
            }
          } else if (settings.selected_days?.length) {
            for (const day of settings.selected_days) {
              if (day >= 0 && day < 7) schedule[day] = "Workout";
            }
          }
        } else if (settings.tracking_style === "sequence" && settings.rotation?.length) {
          rotationOrder = settings.rotation.map((r) => r.label ?? `Day ${(r.index ?? 0) + 1}`);
          rotationOrder.forEach((label, i) => {
            if (i < 7) schedule[i] = label;
          });
        }

        const isSequence = settings.tracking_style === "sequence" && rotationOrder.length > 0;
        const restFromSetup =
          settings.preferences?.timer_enabled && settings.preferences.timer_default_sec
            ? settings.preferences.timer_default_sec
            : 0;
        await updateAppData(userId, (current) => ({
          ...current,
          workoutSchedule: schedule,
          workoutSetupComplete: true,
          trackingStyle: isSequence ? "inconsistent" : "scheduled",
          rotationOrder,
          preferred_rest_sec: restFromSetup || current.preferred_rest_sec || 0,
        }));
        if (!cancelled) {
          setWorkoutSchedule(schedule);
          if (restFromSetup > 0) setPreferredRestSec(restFromSetup);
          await loadDayWorkouts();
        }
      } catch {
        // ignore; keep default schedule
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    loadDayWorkouts();
  }, [currentDayIndex, userId]);

  // Load preferred rest when opening Add/Edit Exercise modal
  useEffect(() => {
    if (showModal) {
      loadAppData(userId).then((data) => {
        setPreferredRestSec(data.preferred_rest_sec ?? 0);
      });
    }
  }, [showModal, userId]);

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
      // Timer finished, play sound or notification
      setTimeout(() => {
        setActiveBreakTimer(null);
      }, 1000);
    }
  }, [activeBreakTimer]);

  const loadWorkoutSchedule = async () => {
    const data = await loadAppData(userId);
    setWorkoutSchedule(data.workoutSchedule);
    const style = (data.trackingStyle as TrackingStyle) ?? "scheduled";
    setTrackingStyle(style);
    setWeeklyGoal(data.weeklyGoal ?? 3);
    const order = data.rotationOrder ?? [];
    setRotationOrder(order);
    setWorkoutHistory(data.workoutHistory ?? []);
    if (style === "inconsistent" && order.length > 0) {
      setCurrentDayIndex((i) => (i >= order.length ? 0 : i));
    }
  };

  const loadDayWorkouts = async () => {
    try {
    const data = await loadAppData(userId);
      // Get workouts for current day directly (they're already organized by day)
      const dayWorkouts = (data.savedWorkouts[currentDayIndex] || []) as any[];
      
      // Migrate old exercises with single category to categories array
      const migratedWorkouts = dayWorkouts.map((exercise) => {
        // Ensure categories array exists
        if (!exercise.categories) {
          if ((exercise as any).category) {
            return {
              ...exercise,
              categories: [(exercise as any).category],
            } as Exercise;
          } else {
            // Default to legs if no category at all
            return {
              ...exercise,
              categories: ["legs"],
            } as Exercise;
          }
        }
        // Ensure categories is an array
        if (!Array.isArray(exercise.categories)) {
          return {
            ...exercise,
            categories: [exercise.categories],
          } as Exercise;
        }
        return exercise as Exercise;
      });

      // Migrate sets: weight 0 → null (treat as "no weight", hidden)
      const withSetWeight = migratedWorkouts.map((ex) => {
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
      const uniqueWorkouts = Array.from(
        new Map(sanitized.map((exercise) => [exercise.id, exercise])).values()
      );
      setWorkouts(uniqueWorkouts);
    } catch (error) {
      console.error("Error loading workouts:", error);
      setWorkouts([]);
    }
  };

  const saveDayWorkouts = async (updatedWorkouts: Exercise[]) => {
    // Save all workouts, not just current day
    await updateAppData(userId, (current) => {
      // Get all unique workouts from all days
      const allWorkouts = current.savedWorkouts.flat() as Exercise[];
      const workoutMap = new Map<number, Exercise>();
      
      // Add existing workouts to map (deduplicated by ID)
      allWorkouts.forEach((w) => {
        if (!workoutMap.has(w.id)) {
          workoutMap.set(w.id, w);
        }
      });
      
      // Update or add workouts from the updated list
      updatedWorkouts.forEach((workout) => {
        workoutMap.set(workout.id, workout);
      });
      
      // Reorganize by selected days - create fresh arrays
      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      workoutMap.forEach((workout) => {
        if (!workout.selectedDays || workout.selectedDays.length === 0) {
          // Add to all days if no selection
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
  };

  const addExercise = async (exercise: Exercise) => {
    try {
      // Add timeout protection
      const savePromise = (async () => {
    if (editingExercise) {
          // Update existing exercise - remove from all days first, then add to new days
          await updateAppData(userId, (current) => {
            const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
            
            // First, remove the exercise from all days
            for (let day = 0; day < 7; day++) {
              const dayWorkouts = (current.savedWorkouts[day] || []) as any[];
              savedWorkouts[day] = dayWorkouts.filter((e) => {
                // Handle both old and new format
                const eId = e.id;
                return eId !== editingExercise.id;
              }) as Exercise[];
            }
            
            // Then add the updated exercise to the appropriate days
            if (!exercise.selectedDays || exercise.selectedDays.length === 0) {
              // Add to all days if no selection
              for (let i = 0; i < 7; i++) {
                savedWorkouts[i] = [...savedWorkouts[i], exercise];
              }
            } else {
              // Add to selected days only
              exercise.selectedDays.forEach((day) => {
                savedWorkouts[day] = [...savedWorkouts[day], exercise];
              });
            }
            
            return { ...current, savedWorkouts };
          });
      setEditingExercise(null);
    } else {
          // Add new exercise - add it to the appropriate days
          await updateAppData(userId, (current) => {
            const savedWorkouts = [...current.savedWorkouts];
            
            if (!exercise.selectedDays || exercise.selectedDays.length === 0) {
              // Add to all days if no selection
              for (let i = 0; i < 7; i++) {
                savedWorkouts[i] = [...(savedWorkouts[i] || []), exercise];
              }
            } else {
              // Add to selected days only
              exercise.selectedDays.forEach((day) => {
                savedWorkouts[day] = [...(savedWorkouts[day] || []), exercise];
              });
            }
            
            return { ...current, savedWorkouts };
          });
        }
        await loadDayWorkouts(); // Reload to show updated list
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      
    setShowModal(false);
    } catch (error) {
      console.error("Error saving exercise:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      alert(errorMsg.includes("timeout") 
        ? "Save is taking longer than expected. Please try again." 
        : "Failed to save exercise. Please try again.");
      throw error; // Re-throw so handleSave can catch it
    }
  };

  const removeExercise = async (id: number) => {
    await updateAppData(userId, (current) => {
      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      
      // Remove the exercise from all days
      for (let day = 0; day < 7; day++) {
        const dayWorkouts = (current.savedWorkouts[day] || []) as Exercise[];
        savedWorkouts[day] = dayWorkouts.filter((e) => e.id !== id);
      }
      
      return { ...current, savedWorkouts };
    });
    await loadDayWorkouts();
  };

  const toggleSetComplete = async (exerciseId: number, setIndex: number, breakTime?: number) => {
    const allData = await loadAppData(userId);
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((exercise) => {
      if (exercise.id === exerciseId && exercise.sets) {
        const updatedSets = [...exercise.sets];
        updatedSets[setIndex].completed = !updatedSets[setIndex].completed;
        if (breakTime && updatedSets[setIndex].completed && !updatedSets[setIndex].breakTime) {
          updatedSets[setIndex].breakTime = breakTime;
        }
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
    
    // Start break timer if set was completed and break time is set
    const exercise = updatedWorkouts.find((e) => e.id === exerciseId);
    if (exercise?.sets?.[setIndex]?.completed && exercise.sets[setIndex].breakTime) {
      setActiveBreakTimer({
        exerciseId,
        setIndex,
        timeLeft: exercise.sets[setIndex].breakTime!,
      });
    }
  };

  const selectAllSets = async (exerciseId: number) => {
    const allData = await loadAppData(userId);
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((exercise) => {
      if (exercise.id === exerciseId && exercise.sets) {
        const allCompleted = exercise.sets.every((set) => set.completed);
        const updatedSets = exercise.sets.map((set) => ({
          ...set,
          completed: !allCompleted,
        }));
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const updateExerciseSets = async (exerciseId: number, newSets: Set[]) => {
    const allData = await loadAppData(userId);
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((ex) =>
      ex.id === exerciseId ? { ...ex, sets: newSets } : ex
    );
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const addSetToExercise = async (exerciseId: number) => {
    const exercise = workouts.find((e) => e.id === exerciseId);
    if (!exercise?.sets) return;
    const defaultRest = preferredRestSec ?? 0;
    const newSet: Set = {
      setNumber: exercise.sets.length + 1,
      reps: 10,
      weight: null,
      completed: false,
      breakTime: defaultRest > 0 ? defaultRest : undefined,
    };
    const newSets = [...exercise.sets, newSet].map((s, i) => ({ ...s, setNumber: i + 1 }));
    await updateExerciseSets(exerciseId, newSets);
  };

  const removeSetFromExercise = async (exerciseId: number, setIndex: number) => {
    const exercise = workouts.find((e) => e.id === exerciseId);
    if (!exercise?.sets || exercise.sets.length <= 1) return;
    const newSets = exercise.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, setNumber: i + 1 }));
    await updateExerciseSets(exerciseId, newSets);
  };

  const updateSetField = async (exerciseId: number, setIndex: number, field: "reps" | "weight", value: number | null) => {
    const exercise = workouts.find((e) => e.id === exerciseId);
    if (!exercise?.sets?.[setIndex]) return;
    const newSets = exercise.sets.map((s, i) =>
      i === setIndex ? { ...s, [field]: value } : s
    );
    await updateExerciseSets(exerciseId, newSets);
  };

  const updateSetRest = async (exerciseId: number, setIndex: number, sec: number) => {
    const exercise = workouts.find((e) => e.id === exerciseId);
    if (!exercise?.sets?.[setIndex]) return;
    const newSets = exercise.sets.map((s, i) =>
      i === setIndex ? { ...s, breakTime: sec > 0 ? sec : undefined } : s
    );
    await updateExerciseSets(exerciseId, newSets);
    if (sec > 0) {
      await updateAppData(userId, (d) => ({ ...d, preferred_rest_sec: sec }));
      setPreferredRestSec(sec);
    }
  };

  const toggleExerciseComplete = async (id: number) => {
    const allData = await loadAppData(userId);
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((e) =>
      e.id === id ? { ...e, completed: !e.completed } : e
    );
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const resetDayProgress = async () => {
    const allData = await loadAppData(userId);
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((exercise) => {
      // Only reset exercises that appear on current day
      const appearsToday = !exercise.selectedDays || exercise.selectedDays.length === 0 || exercise.selectedDays.includes(currentDayIndex);
      if (appearsToday && exercise.sets) {
        const resetSets = exercise.sets.map((set) => ({
          ...set,
          completed: false,
        }));
        return { ...exercise, sets: resetSets, completed: false };
      }
      return exercise;
    });
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const initializeDefaultRoutine = async () => {
    if (!confirm("This will replace your current workout routine with the default 4-day split (Push, Pull, Legs, Full Upper). Continue?")) {
      return;
    }

    try {
      const defaultExercises = getDefaultWorkoutRoutine();
      const defaultSchedule = getDefaultWorkoutSchedule();

      // Organize exercises by day
      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      
      defaultExercises.forEach((exercise) => {
        const exerciseDays = exercise.selectedDays || [];
        if (exerciseDays.length === 0) {
          // Add to all days if no selection
          for (let i = 0; i < 7; i++) {
            savedWorkouts[i].push(exercise as Exercise);
          }
        } else {
          exerciseDays.forEach((day) => {
            savedWorkouts[day].push(exercise as Exercise);
          });
        }
      });

      await updateAppData(userId, (current) => ({
        ...current,
        savedWorkouts,
        workoutSchedule: defaultSchedule,
        workoutSetupComplete: true,
      }));

      await loadWorkoutSchedule();
      await loadDayWorkouts();
      alert("Default workout routine initialized successfully!");
    } catch (error) {
      console.error("Error initializing routine:", error);
      alert("Failed to initialize routine. Please try again.");
    }
  };

  const completeWorkout = async () => {
    if (workouts.length === 0) {
      alert("Add at least one exercise before completing the workout");
      return;
    }

    const workoutEntry = {
      date: formatDateKey(new Date()),
      timestamp: Date.now(),
      dayOfWeek: currentDayIndex,
      workoutType: workoutSchedule[currentDayIndex],
      exercises: [...workouts],
    };

    await updateAppData(userId, (current) => ({
      ...current,
      workoutHistory: [...current.workoutHistory, workoutEntry],
    }));
    const data = await loadAppData(userId);
    setWorkoutHistory(data.workoutHistory ?? []);

    // Mirror completion into workout_logs so Feed/Stats sync across devices.
    try {
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
          sum + (ex.sets?.reduce((s, set) => s + (set.weight != null ? 1 : 0), 0) ?? 0),
        0
      );
      const avgWeight = weightedCount > 0 ? Math.round(weightedSum / weightedCount) : null;

      await insertLog(userId, {
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
        notes: undefined,
      });
    } catch (error) {
      console.warn("Failed to sync completed workout to feed", error);
    }

    // Reset progress but keep workouts
    await resetDayProgress();
    alert("Workout completed and saved to history!");

    // Auto-advance to next day
    navigateDay("next");
  };

  const navigateDay = (direction: "prev" | "next") => {
    const sequenceLabels =
      settingsProp?.tracking_style === "sequence" && settingsProp?.rotation?.length
        ? settingsProp.rotation.map((r) => r.label ?? `Day ${(r.index ?? 0) + 1}`)
        : trackingStyle === "inconsistent" && rotationOrder.length > 0
          ? rotationOrder
          : null;
    const maxIndex = sequenceLabels && sequenceLabels.length > 0 ? sequenceLabels.length - 1 : 6;
    if (direction === "prev") {
      setCurrentDayIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    } else {
      setCurrentDayIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const sequenceLabels =
    settingsProp?.tracking_style === "sequence" && settingsProp?.rotation?.length
      ? settingsProp.rotation.map((r) => r.label ?? `Day ${(r.index ?? 0) + 1}`)
      : trackingStyle === "inconsistent" && rotationOrder.length > 0
        ? rotationOrder
        : null;
  const isInconsistent = !!sequenceLabels;
  const navigatorLabels = isInconsistent ? sequenceLabels : days;
  const workoutsThisWeek = getWorkoutsCompletedThisWeek(workoutHistory);
  const isToday = isInconsistent
    ? currentDayIndex === workoutsThisWeek % Math.max(1, navigatorLabels.length)
    : currentDayIndex === new Date().getDay();
  const getDateLabel = () => {
    if (isInconsistent && navigatorLabels[currentDayIndex]) {
      return navigatorLabels[currentDayIndex];
    }
    return days[currentDayIndex] ?? "Today";
  };

  const nextSlotIndex = isInconsistent ? workoutsThisWeek % Math.max(1, navigatorLabels.length) : currentDayIndex;
  const goalHit = isInconsistent && workoutsThisWeek >= weeklyGoal;

  useEffect(() => {
    const maxIndex = Math.max(0, navigatorLabels.length - 1);
    setCurrentDayIndex((prev) => (prev > maxIndex ? 0 : prev));
  }, [navigatorLabels.length]);

  return (
    <div className="mx-auto w-full max-w-lg">
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
              transition={{ type: "spring", damping: 20, stiffness: 250 }}
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

      {/* Day Navigator */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-3 py-2">
        <button
          type="button"
          onClick={() => navigateDay("prev")}
          className="rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-[var(--bg3)] hover:text-[var(--text)]"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text)]">{getDateLabel()}</p>
          {isToday && (
            <p className="text-[10px] text-[var(--ice)]">Today</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigateDay("next")}
          className="rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-[var(--bg3)] hover:text-[var(--text)]"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Primary CTA: Add Exercise */}
      <div className="mb-6">
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setEditingExercise(null);
            setShowModal(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)] px-5 py-4 text-base font-semibold text-[var(--ice)] transition-colors hover:border-[var(--ice)] hover:bg-[var(--iceSoft)]"
        >
          <Plus className="h-5 w-5" />
          Add Exercise
        </motion.button>
      </div>

      {/* Exercise List */}
      <div className="mb-6">
        {workouts.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 py-10 text-center">
            <p className="text-sm text-[var(--textMuted)]">No exercises yet.</p>
            <p className="mt-1 text-xs text-[var(--textMuted)]">Tap &quot;Add Exercise&quot; above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
        <AnimatePresence>
          {workouts.map((exercise) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-medium text-[var(--text)]">{sanitizeExerciseDisplayText(exercise.name) || "Exercise"}</h3>
                      <span className="mt-1 inline-block rounded border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-0.5 text-xs text-[var(--textMuted)]">
                        {exercise.categories && exercise.categories.length > 0
                          ? exercise.categories.map((cat) => ALL_CATEGORIES.find((c) => c.value === cat)?.label || cat).join(", ")
                          : "Uncategorized"}
                  </span>
                </div>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingExercise(exercise);
                      setShowModal(true);
                    }}
                        className="rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-[var(--bg3)] hover:text-[var(--ice)]"
                        aria-label="Edit exercise"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeExercise(exercise.id)}
                        className="rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Delete exercise"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

                  {exercise.sets && exercise.sets.length > 0 && (
                <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--textMuted)]">Sets</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => selectAllSets(exercise.id)}
                            className="text-xs text-[var(--textMuted)] hover:text-[var(--ice)] hover:underline underline-offset-2"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={() => addSetToExercise(exercise.id)}
                            className="text-xs font-medium text-[var(--ice)] hover:underline"
                          >
                            + Add set
                          </button>
                        </div>
                      </div>
                  {exercise.sets.map((set, index) => (
                    <SetRowCard
                      key={`${exercise.id}-${index}`}
                      set={set}
                      exerciseId={exercise.id}
                      index={index}
                      canRemove={exercise.sets.length > 1}
                      onRepsBlur={(v) => updateSetField(exercise.id, index, "reps", v)}
                      onWeightBlur={(v) => updateSetField(exercise.id, index, "weight", v)}
                      onRestChange={(sec) => updateSetRest(exercise.id, index, sec)}
                      onToggleComplete={() => toggleSetComplete(exercise.id, index, set.breakTime)}
                      onRemove={() => removeSetFromExercise(exercise.id, index)}
                    />
                  ))}
                </div>
              )}

              {exercise.notes && (
                <div className="mt-3 border-t border-[var(--border)] pt-3 text-sm text-[var(--textMuted)]">
                  {sanitizeExerciseDisplayText(exercise.notes)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
          </div>
        )}
      </div>

      {/* Complete Workout Button */}
      {workouts.length > 0 && (
        <div className="mb-6 pb-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={completeWorkout}
            className="w-full rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)] px-4 py-3 text-sm font-medium text-[var(--ice)] transition-colors hover:border-[var(--ice)]"
          >
            Complete workout
          </motion.button>
        </div>
      )}

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
          sequenceLabels && sequenceLabels.length > 0 ? sequenceLabels : undefined
        }
        modes={settingsProp?.modes}
        defaultBreakTime={
          settingsProp?.preferences?.timer_enabled && settingsProp?.preferences?.timer_default_sec != null
            ? settingsProp.preferences.timer_default_sec
            : 0
        }
        onBreakTimeChange={async (sec) => {
          await updateAppData(userId, (d) => ({ ...d, preferred_rest_sec: sec }));
          setPreferredRestSec(sec);
        }}
        userId={userId}
      />
    </div>
  );
};

/** One editable row in Add/Edit Exercise (reps, optional weight, rest, optional RPE, drop set). */
type SetRow = {
  reps: number | null;
  weight: number | null;
  restSec: number;
  rpe?: number | null;
  isDropSet?: boolean;
};

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
  /** When in "No schedule" mode, e.g. ["Day 1", "Day 2", "Day 3"]. Otherwise weekdays. */
  dayLabels?: string[];
  /** From setup wizard; controls RPE, drop set, progressive overload in the modal. */
  modes?: { progressiveOverload?: boolean; dropSets?: boolean; rpe?: boolean };
  defaultBreakTime?: number;
  onBreakTimeChange?: (sec: number) => void;
  userId: string;
}

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ExerciseCategory[]>([]);
  const [setRows, setSetRows] = useState<SetRow[]>(() => defaultSetRows(defaultBreakTime));
  const [selectedDays, setSelectedDays] = useState<number[]>([currentDayIndex]);
  const [notes, setNotes] = useState("");
  const [isSavingExercise, setIsSavingExercise] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
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
        const exercises = (entry as { exercises?: unknown[] }).exercises ?? [];
        for (const ex of exercises) {
          const e = ex as { name?: string; sets?: { weight?: number | null }[] };
          if (e.name?.trim().toLowerCase() === searchName && e.sets?.length) {
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
    return () => { cancelled = true; };
  }, [show, name, modes?.progressiveOverload, userId]);

  const days = dayLabels && dayLabels.length > 0 ? dayLabels : WEEKDAY_LABELS;
  const isWeekdayMode = !dayLabels?.length;

  // Exercise database with Planet Fitness equipment and exercises
  const exerciseDatabase: Record<ExerciseCategory, string[]> = {
    chest: [
      "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Press",
      "Incline Dumbbell Press", "Decline Dumbbell Press", "Cable Fly", "Pec Deck Machine",
      "Push-ups", "Dips", "Chest Press Machine", "Smith Machine Bench Press",
      "Chest Fly Machine", "Pec Deck", "Cable Crossover", "Dumbbell Flyes",
      "Incline Cable Fly", "Decline Cable Fly", "Flat Chest Press Machine",
      "Incline Chest Press Machine", "Decline Chest Press Machine", "Cable Chest Press",
      "Smith Machine Incline Press", "Smith Machine Decline Press", "Dumbbell Pullover",
      "Cable Pullover", "Push-up Variations", "Diamond Push-ups", "Wide Push-ups",
      "Incline Push-ups", "Decline Push-ups", "Chest Dips", "Assisted Dips"
    ],
    back: [
      "Pull-ups", "Lat Pulldown", "Barbell Row", "Dumbbell Row", "Cable Row",
      "Seated Row Machine", "T-Bar Row", "Bent Over Row", "One-Arm Row",
      "Wide Grip Pulldown", "Close Grip Pulldown", "Reverse Grip Pulldown",
      "Reverse Fly", "Face Pull", "Shrugs", "Deadlift", "Rack Pull",
      "Hyperextension", "Cable Lat Pulldown", "Cable High Row", "Cable Low Row",
      "Seated Cable Row", "Standing Cable Row", "Wide Grip Cable Row",
      "Close Grip Cable Row", "Cable Face Pull", "Cable Reverse Fly",
      "Smith Machine Row", "Smith Machine Shrugs", "Dumbbell Shrugs",
      "Barbell Shrugs", "Cable Shrugs", "Hyperextension Machine",
      "Back Extension Machine", "Assisted Pull-ups", "Lat Pulldown Machine",
      "Seated Row Machine", "Cable Reverse Fly", "Cable Upright Row"
    ],
    shoulders: [
      "Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Front Raise",
      "Rear Delt Fly", "Arnold Press", "Cable Lateral Raise", "Face Pull",
      "Upright Row", "Shrugs", "Reverse Fly", "Shoulder Press Machine",
      "Pike Push-ups", "Handstand Push-ups", "Cable Rear Delt Fly",
      "Lateral Raise Machine", "Rear Deltoid Machine", "Shoulder Press Machine",
      "Smith Machine Shoulder Press", "Cable Shoulder Press", "Dumbbell Lateral Raise",
      "Cable Front Raise", "Barbell Front Raise", "Dumbbell Front Raise",
      "Cable Upright Row", "Barbell Upright Row", "Dumbbell Upright Row",
      "Reverse Pec Deck", "Rear Delt Machine", "Cable Lateral Raise",
      "Dumbbell Rear Delt Fly", "Cable Rear Delt Fly", "Face Pull Machine",
      "Shoulder Press Machine", "Overhead Press Machine", "Pike Push-ups",
      "Wall Handstand Push-ups", "Dumbbell Arnold Press", "Cable Arnold Press"
    ],
    legs: [
      "Squats", "Leg Press", "Leg Extension", "Leg Curl", "Romanian Deadlift",
      "Bulgarian Split Squat", "Lunges", "Walking Lunges", "Calf Raises",
      "Hack Squat", "Smith Machine Squat", "Goblet Squat", "Step-ups",
      "Leg Press Machine", "Seated Calf Raise", "Standing Calf Raise", "Hip Thrust",
      "Leg Extension Machine", "Seated Leg Curl", "Lying Leg Curl",
      "Standing Leg Curl", "Hack Squat Machine", "Smith Machine Lunges",
      "Dumbbell Lunges", "Barbell Lunges", "Reverse Lunges", "Side Lunges",
      "Curtsy Lunges", "Jump Lunges", "Leg Press 45 Degree", "Leg Press Horizontal",
      "Seated Leg Press", "Calf Raise Machine", "Seated Calf Raise Machine",
      "Standing Calf Raise Machine", "Smith Machine Calf Raises", "Hip Abductor Machine",
      "Hip Adductor Machine", "Glute Kickback Machine", "Leg Press Machine",
      "Smith Machine Leg Press", "Dumbbell Step-ups", "Box Step-ups",
      "Romanian Deadlift Machine", "Smith Machine RDL", "Dumbbell RDL",
      "Barbell RDL", "Good Mornings", "Smith Machine Good Mornings",
      "Hip Thrust Machine", "Glute Bridge", "Single Leg Press", "Pistol Squats"
    ],
    arms: [
      "Bicep Curl", "Hammer Curl", "Tricep Extension", "Tricep Dips",
      "Cable Curl", "Preacher Curl", "Concentration Curl", "Overhead Tricep Extension",
      "Close Grip Bench Press", "Skull Crushers", "Cable Tricep Pushdown",
      "Barbell Curl", "Dumbbell Curl", "Tricep Kickback", "Rope Cable Curl",
      "Bicep Curl Machine", "Preacher Curl Machine", "Tricep Extension Machine",
      "Cable Bicep Curl", "Cable Hammer Curl", "Cable Preacher Curl",
      "Cable Concentration Curl", "Dumbbell Hammer Curl", "Barbell Hammer Curl",
      "Cable Tricep Extension", "Overhead Cable Tricep Extension", "Dumbbell Tricep Extension",
      "Dumbbell Overhead Extension", "Cable Overhead Extension", "Rope Tricep Pushdown",
      "Straight Bar Tricep Pushdown", "Close Grip Cable Press", "Smith Machine Close Grip Press",
      "Dumbbell Skull Crushers", "Cable Skull Crushers", "Tricep Dips Machine",
      "Assisted Tricep Dips", "Cable Tricep Kickback", "Dumbbell Tricep Kickback",
      "Reverse Grip Cable Curl", "Cable Reverse Curl", "Barbell Reverse Curl",
      "Dumbbell Reverse Curl", "21s Bicep Curls", "Cable 21s", "Spider Curls",
      "Cable Spider Curls", "Incline Dumbbell Curl", "Standing Cable Curl",
      "Seated Cable Curl", "Cable Rope Hammer Curl"
    ],
    core: [
      "Plank", "Crunches", "Sit-ups", "Russian Twists", "Leg Raises",
      "Mountain Climbers", "Bicycle Crunches", "Dead Bug", "Hollow Hold",
      "Ab Wheel", "Cable Crunch", "Hanging Leg Raise", "Side Plank",
      "Reverse Crunch", "Flutter Kicks", "V-Ups", "Dragon Flag",
      "Ab Crunch Machine", "Abdominal Crunch Machine", "Torso Rotation Machine",
      "Roman Chair", "Roman Chair Sit-ups", "Roman Chair Leg Raises",
      "Cable Crunch", "Cable Woodchopper", "Cable Side Crunch", "Cable Reverse Crunch",
      "Cable Leg Raise", "Hanging Knee Raises", "Hanging Leg Raises",
      "Hanging Windshield Wipers", "Plank Variations", "Side Plank",
      "Reverse Plank", "Plank to Pike", "Plank Jacks", "Mountain Climbers",
      "Bicycle Crunches", "Reverse Crunches", "Flutter Kicks", "Scissor Kicks",
      "Dead Bug", "Hollow Hold", "V-Ups", "Dragon Flag", "Ab Wheel Rollout",
      "Cable Ab Crunch", "Cable Oblique Crunch", "Russian Twists", "Weighted Russian Twists",
      "Medicine Ball Crunches", "Stability Ball Crunches", "Decline Crunches",
      "Incline Crunches", "Reverse Crunch Machine", "Ab Coaster", "Ab Crunch Bench"
    ],
    cardio: [
      "Running", "Treadmill", "Elliptical", "Bike", "Rowing Machine",
      "Stair Climber", "Jump Rope", "Burpees", "High Knees", "Jumping Jacks",
      "Boxing", "Swimming", "Cycling", "HIIT", "Sprint Intervals",
      "Treadmill Walking", "Treadmill Jogging", "Treadmill Running", "Treadmill Incline",
      "Elliptical Trainer", "Elliptical Cross Trainer", "ARC Trainer",
      "Stationary Bike", "Upright Bike", "Recumbent Bike", "Rowing Machine",
      "Concept2 Rower", "Stair Climber", "StepMill", "Stepper Machine",
      "Recumbent Stepper", "Low Impact Stepper", "Jump Rope", "Jumping Rope",
      "Burpees", "High Knees", "Jumping Jacks", "Mountain Climbers",
      "Boxing Bag", "Heavy Bag", "Speed Bag", "Swimming", "Pool Swimming",
      "Cycling", "Indoor Cycling", "HIIT Cardio", "Sprint Intervals",
      "Tabata", "Circuit Training", "Interval Training", "Steady State Cardio",
      "LISS Cardio", "Walking", "Power Walking", "Jogging", "Running",
      "Treadmill Intervals", "Elliptical Intervals", "Bike Intervals",
      "Rowing Intervals", "Stair Climber Intervals", "Jump Rope Intervals"
    ],
    full_body: [
      "Burpees", "Thrusters", "Clean and Press", "Kettlebell Swing",
      "Turkish Get-up", "Man Makers", "Bear Crawl", "Mountain Climbers",
      "Jump Squats", "Box Jumps", "Battle Ropes", "Sled Push",
      "Full Body Circuit", "Compound Movements", "Clean and Jerk",
      "Snatch", "Power Clean", "Deadlift", "Squat to Press", "Dumbbell Thrusters",
      "Barbell Thrusters", "Kettlebell Thrusters", "Turkish Get-ups",
      "Man Makers", "Bear Crawl", "Crab Walk", "Duck Walk", "Jump Squats",
      "Box Jumps", "Plyometric Box Jumps", "Battle Ropes", "Sled Push",
      "Farmers Walk", "Suitcase Carry", "Overhead Carry", "Rowing Machine",
      "Full Body Rowing", "Cable Full Body", "Smith Machine Full Body",
      "Circuit Training", "HIIT Full Body", "Tabata Full Body",
      "Full Body Dumbbell", "Full Body Barbell", "Full Body Kettlebell"
    ],
  };

  // Get example exercises based on selected categories
  const getExampleExercises = (): string[] => {
    if (selectedCategories.length === 0) return [];
    const examples: string[] = [];
    selectedCategories.forEach((cat) => {
      if (exerciseDatabase[cat]) {
        examples.push(...exerciseDatabase[cat].slice(0, 3));
      }
    });
    return [...new Set(examples)].slice(0, 6);
  };

  // Filter exercise suggestions based on input
  useEffect(() => {
    if (name.trim().length > 0) {
      const searchTerm = name.toLowerCase();
      const allExercises = selectedCategories.length > 0
        ? selectedCategories.flatMap((cat) => exerciseDatabase[cat] || [])
        : Object.values(exerciseDatabase).flat();
      
      const filtered = allExercises
        .filter((ex) => ex.toLowerCase().includes(searchTerm))
        .slice(0, 8);
      
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, selectedCategories]);

  useEffect(() => {
    if (editingExercise) {
      setName(editingExercise.name);
      if (editingExercise.categories && editingExercise.categories.length > 0) {
        setSelectedCategories(editingExercise.categories);
      } else if ((editingExercise as any).category) {
        setSelectedCategories([(editingExercise as any).category]);
      } else {
        setSelectedCategories([]);
      }
      if (editingExercise.sets && editingExercise.sets.length > 0) {
        setSetRows(editingExercise.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight ?? null,
          restSec: s.breakTime ?? 0,
          rpe: (s as Set).rpe ?? null,
          isDropSet: (s as Set).isDropSet ?? false,
        })));
      } else {
        setSetRows(defaultSetRows(defaultBreakTime));
      }
      setSelectedDays(editingExercise.selectedDays || [currentDayIndex]);
      setNotes(editingExercise.notes || "");
    } else {
      resetForm();
    }
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
    setSetRows((prev) => [
      ...prev,
      { reps: null, weight: null, restSec: defaultBreakTime, rpe: null, isDropSet: false },
    ]);
  };
  const addDropSetRow = () => {
    const last = setRows[setRows.length - 1];
    const lastWeight = last?.weight ?? null;
    const lastReps = last?.reps ?? null;
    const dropWeight =
      lastWeight != null && lastWeight > 0 ? Math.round(lastWeight * 0.8 * 2) / 2 : null;
    setSetRows((prev) => [
      ...prev,
      {
        reps: lastReps,
        weight: dropWeight,
        restSec: defaultBreakTime,
        rpe: null,
        isDropSet: true,
      },
    ]);
  };
  const removeSetRow = (index: number) => {
    setSetRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };
  const updateSetRow = (
    index: number,
    field: "reps" | "weight" | "restSec" | "rpe",
    value: number | null
  ) => {
    setSetRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    if (field === "restSec" && typeof value === "number" && value > 0) onBreakTimeChange?.(value);
  };

  const toggleCategory = (category: ExerciseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };


  const handleSave = async () => {
    if (isSavingExercise) {
      return; // Prevent duplicate saves
    }

    if (!name.trim()) {
      alert("Please enter an exercise name");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    setIsSavingExercise(true);
    
    try {
    const exercise: Exercise = {
      id: editingExercise?.id || Date.now(),
      name: name.trim(),
      categories: selectedCategories.length > 0 ? selectedCategories : [],
      notes: notes.trim() || undefined,
      completed: false,
      selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
      sets: setRows.map((row, i) => ({
        setNumber: i + 1,
        reps: row.reps ?? 0,
        weight: row.weight,
        completed: false,
        breakTime: row.restSec > 0 ? row.restSec : undefined,
        rpe: modes?.rpe && row.rpe != null ? row.rpe : undefined,
        isDropSet: row.isDropSet === true,
      })),
    };

      // Add timeout protection
      const savePromise = Promise.resolve(onSave(exercise));
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      
    resetForm();
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error("Error saving exercise:", error);
      alert("Failed to save exercise. Please try again.");
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
                    {editingExercise ? "Update exercise details" : "Create a new exercise"}
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

              <div className="space-y-3 mb-4">
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
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg2)] shadow-xl">
                      {filteredSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setName(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg3)]"
                        >
                          {suggestion}
                        </button>
                      ))}
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
                    {isWeekdayMode ? "Which day(s)?" : "Which workout day(s)?"}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {days.map((day, index) => (
                      <button
                        key={`${day}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedDays((prev) =>
                            prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
                          );
                        }}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                          selectedDays.includes(index)
                            ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
                            : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:border-[var(--ice)]/40"
                        }`}
                      >
                        {isWeekdayMode ? day.substring(0, 3) : day}
                      </button>
                    ))}
                  </div>
                </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs text-[var(--textMuted)]">Sets</label>
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
                <div className="mb-1 grid items-end gap-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-[var(--textMuted)]" style={{ gridTemplateColumns: `1.5rem 1fr 1fr 1fr${modes?.rpe ? " 2rem" : ""} 1.25rem` }}>
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
                      style={{ gridTemplateColumns: `1.5rem 1fr 1fr 1fr${modes?.rpe ? " 2rem" : ""} 1.25rem` }}
                    >
                      {/* Set label */}
                      <span className="text-center text-[11px] font-medium text-[var(--textMuted)]">
                        {row.isDropSet ? "D" : index + 1}
                      </span>

                      {/* Reps */}
                      <input
                        type="number"
                        min="0"
                        placeholder="—"
                        value={row.reps != null ? String(row.reps) : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateSetRow(index, "reps", v === "" ? null : (parseInt(v, 10) || 0));
                        }}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1.5 py-1 text-center text-xs text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
                      />

                      {/* Weight */}
                      <input
                        type="number"
                        min="0"
                        step="2.5"
                        placeholder={modes?.progressiveOverload && lastWeight ? String(lastWeight) : "—"}
                        value={row.weight != null ? String(row.weight) : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateSetRow(index, "weight", v === "" ? null : (parseFloat(v) || 0));
                        }}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1.5 py-1 text-center text-xs text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
                      />

                      {/* Rest */}
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min="0"
                          aria-label="Rest seconds"
                          value={row.restSec > 0 ? String(row.restSec) : ""}
                          onChange={(e) => updateSetRow(index, "restSec", parseInt(e.target.value, 10) || 0)}
                          placeholder="—"
                          className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1.5 py-1 text-center text-xs text-[var(--text)] placeholder:text-[var(--textMuted)]/50 focus:border-[var(--ice)]/50 focus:outline-none"
                        />
                        <span className="shrink-0 text-[9px] text-[var(--textMuted)]">s</span>
                      </div>

                      {/* RPE */}
                      {modes?.rpe && (
                        <input
                          type="number"
                          min={1}
                          max={10}
                          aria-label="RPE 1-10"
                          value={row.rpe ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSetRow(index, "rpe", v === "" ? null : Math.min(10, Math.max(1, parseInt(v, 10) || 0)));
                          }}
                          placeholder="—"
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg2)] px-1 py-1 text-center text-xs text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                        />
                      )}

                      {/* Delete */}
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

                {modes?.progressiveOverload && lastWeight != null && lastWeight > 0 && (
                  <p className="mt-1 text-[10px] text-[var(--textMuted)]">Last weight: {lastWeight} lb</p>
                )}
              </div>

                <div>
                  <label className="mb-1 block text-xs text-[var(--textMuted)]">Notes (optional)</label>
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
                  {isSavingExercise ? "Saving..." : editingExercise ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
            </>
          )}
    </AnimatePresence>
  );
};
