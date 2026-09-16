"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { Plus, Dumbbell, Loader2, Play } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { listFOYWorkouts, getFOYWorkoutExercises } from "@/lib/supabase/foyWorkout";
import type { FOYWorkoutWithMeta } from "@/lib/supabase/foyWorkout";
import type { LocalSession } from "@/lib/offline/types";
import * as logging from "@/lib/offline/logging";
import {
  FOYContainer,
  FOYCard,
  FOYButton,
  FOYButtonLink,
  FOYEmptyState,
} from "@/app/focusedonyou/_components";

function formatLastUsed(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`;
  return d.toLocaleDateString();
}

export default function WorkoutListPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<FOYWorkoutWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickStartingId, setQuickStartingId] = useState<string | null>(null);

  const loadWorkouts = useCallback(() => {
    setError("");
    setLoading(true);
    const supabase = getFOYSupabase();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      listFOYWorkouts(supabase, user.id)
        .then(setWorkouts)
        .catch((err) => setError(err instanceof Error ? err.message : "Could not load workouts."))
        .finally(() => setLoading(false));
    });
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  async function handleQuickStart(workoutId: string) {
    const supabase = getFOYSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setQuickStartingId(workoutId);
    setError("");
    try {
      const workout = workouts.find((w) => w.id === workoutId);
      const workoutName = workout?.name ?? "Quick Session";
      let templateExercises: { name: string; order_index: number }[] = [];
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const exercises = await getFOYWorkoutExercises(supabase, workoutId);
          templateExercises = exercises.map((e) => ({ name: e.name, order_index: e.order_index }));
        } catch {
          // Offline or fetch failed; continue with empty template
        }
      }
      const now = new Date().toISOString();
      const session: LocalSession = {
        id: crypto.randomUUID(),
        user_id: user.id,
        workout_id: workoutId,
        started_at: now,
        ended_at: null,
        updated_at: now,
      };
      await logging.createSessionLocal(session, {
        workoutName,
        templateExercises,
      });
      router.push(`/focusedonyou/log/live?sessionId=${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start workout.");
    } finally {
      setQuickStartingId(null);
    }
  }

  if (loading) {
    return (
      <FOYContainer className="py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" aria-hidden />
        </div>
      </FOYContainer>
    );
  }

  if (error) {
    return (
      <FOYContainer className="py-8">
        <p className="text-[var(--textMuted)]">{error}</p>
        <FOYButton className="mt-4" onClick={() => loadWorkouts()}>
          Try again
        </FOYButton>
      </FOYContainer>
    );
  }

  return (
    <FOYContainer className="py-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">Your workouts</h2>
        <FOYButtonLink
          href="/focusedonyou/workout/new"
          variant="primary"
          className="min-h-12 gap-2 px-4"
        >
          <Plus className="h-5 w-5" aria-hidden />
          New Workout
        </FOYButtonLink>
      </div>

      {workouts.length === 0 ? (
        <div className="mt-8">
          <FOYEmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Create a workout with exercises, then quick start when you're ready."
          >
            <FOYButtonLink href="/focusedonyou/workout/new" variant="primary" className="min-h-12 px-6">
              New Workout
            </FOYButtonLink>
          </FOYEmptyState>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {workouts.map((workout) => (
            <motion.li
              key={workout.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <FOYCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium text-[var(--text)]">
                    {workout.name}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--textMuted)]">
                    {workout.last_used_at
                      ? `Last used ${formatLastUsed(workout.last_used_at)}`
                      : `${workout.exercise_count} exercise${workout.exercise_count !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <FOYButton
                  variant="primary"
                  onClick={() => handleQuickStart(workout.id)}
                  disabled={quickStartingId !== null}
                  className="min-h-12 flex-shrink-0 px-5"
                >
                  {quickStartingId === workout.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <>
                      <Play className="h-5 w-5" aria-hidden />
                      <span>Quick Start</span>
                    </>
                  )}
                </FOYButton>
              </FOYCard>
            </motion.li>
          ))}
        </ul>
      )}
    </FOYContainer>
  );
}
