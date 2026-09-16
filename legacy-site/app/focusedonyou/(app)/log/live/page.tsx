"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Plus, Check, ListOrdered } from "lucide-react";
import type { LocalSet } from "@/lib/offline/types";
import { FOYContainer, FOYCard, FOYButton, FOYBackLink } from "@/app/focusedonyou/_components";
import { useSessionTimer, formatElapsed } from "./useSessionTimer";
import { useRestTimer } from "./useRestTimer";
import { RestTimerSheet } from "./RestTimerSheet";
import { AddExerciseSheet } from "./AddExerciseSheet";
import { FOYSyncStatus } from "./FOYSyncStatus";
import { useLiveSession } from "./useLiveSession";

type ExerciseBlock = { name: string; order_index: number };

function buildExerciseList(
  template: { name: string; order_index: number }[],
  sets: LocalSet[]
): ExerciseBlock[] {
  const fromSets = new Map<string, number>();
  for (const s of sets) {
    if (!fromSets.has(s.exercise_name)) {
      fromSets.set(s.exercise_name, s.set_index);
    }
  }
  const templateNames = new Set(template.map((e) => e.name));
  const custom = Array.from(fromSets.entries())
    .filter(([name]) => !templateNames.has(name))
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => ({ name, order_index: 1000 }));
  return [...template, ...custom];
}

export default function LiveSessionPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const restTimer = useRestTimer();
  const {
    session,
    sets,
    workoutName,
    templateExercises,
    loading,
    notFound,
    addSet,
    updateSet,
    addExercise,
    endSession,
    restTimerDefault,
    addSetLoading,
    setAddSetLoading,
    ending,
  } = useLiveSession(sessionId);

  const elapsed = useSessionTimer(session?.started_at ?? null);
  const exerciseList = buildExerciseList(templateExercises, sets);
  const existingNames = new Set(exerciseList.map((e) => e.name));
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  function handleUpdateSet(
    setId: string,
    payload: { reps?: number | null; weight?: number | null; done?: boolean }
  ) {
    updateSet(setId, payload);
    if (payload.done === true) {
      restTimer.start(restTimerDefault);
    }
  }

  if (!sessionId) {
    return (
      <FOYContainer className="py-8">
        <p className="text-[var(--textMuted)]">Session not found.</p>
        <div className="mt-4">
          <FOYBackLink href="/focusedonyou/workout" ariaLabel="Back to workouts">
            Back to Workouts
          </FOYBackLink>
        </div>
      </FOYContainer>
    );
  }

  if (notFound) {
    return (
      <FOYContainer className="py-8">
        <p className="text-[var(--textMuted)]">Session not found. Start a workout from the list.</p>
        <div className="mt-4">
          <FOYBackLink href="/focusedonyou/workout" ariaLabel="Back to workouts">
            Back to Workouts
          </FOYBackLink>
        </div>
      </FOYContainer>
    );
  }

  return (
    <FOYContainer className="pb-32">
      <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-[var(--text)]">
                {loading ? "…" : (workoutName ?? "Quick Session")}
              </h1>
              <FOYSyncStatus />
            </div>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--ice)]">
              {session ? formatElapsed(elapsed) : "0:00"}
            </p>
          </div>
          <FOYButton
            variant="secondary"
            onClick={() => endSession()}
            disabled={ending}
            className="min-h-12 shrink-0 px-4"
          >
            {ending ? "Ending…" : "End Session"}
          </FOYButton>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--textMuted)]">Loading…</p>
      ) : exerciseList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]"
            aria-hidden
          >
            <ListOrdered className="h-6 w-6" />
          </span>
          <p className="text-[var(--textMuted)]">No exercises yet. Add one below.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-6">
          {exerciseList.map((ex, idx) => {
            const setsForEx = sets
              .filter((s) => s.exercise_name === ex.name)
              .sort((a, b) => a.set_index - b.set_index);
            return (
              <motion.li
                key={ex.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <FOYCard className="space-y-3">
                  <p className="font-medium text-[var(--text)]">{ex.name}</p>
                  <div className="flex flex-col gap-2">
                    {setsForEx.map((set) => (
                      <div
                        key={set.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--bg3)]/40 p-2"
                      >
                        <span className="w-8 text-sm text-[var(--textMuted)]">
                          #{set.set_index + 1}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="Reps"
                          value={set.reps ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            handleUpdateSet(set.id, {
                              reps: v === "" ? null : parseInt(v, 10) || null,
                            });
                          }}
                          className="h-10 w-16 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-center text-[var(--text)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="Wt"
                          value={set.weight ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            handleUpdateSet(set.id, {
                              weight: v === "" ? null : parseFloat(v) || null,
                            });
                          }}
                          className="h-10 w-14 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-center text-[var(--text)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSet(set.id, { done: !set.done })
                          }
                          className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg transition-colors ${
                            set.done
                              ? "bg-[var(--ice)]/20 text-[var(--ice)]"
                              : "bg-[var(--bg2)] text-[var(--textMuted)] hover:bg-[var(--ice)]/10"
                          }`}
                          aria-label={set.done ? "Mark set incomplete" : "Mark set done"}
                        >
                          <Check className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSet(ex.name)}
                    disabled={addSetLoading !== null}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/40 hover:text-[var(--ice)] disabled:opacity-50"
                  >
                    {addSetLoading === ex.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" aria-hidden />
                        Add Set
                      </>
                    )}
                  </button>
                </FOYCard>
              </motion.li>
            );
          })}
        </ul>
      )}

      <div className="mt-6">
        <FOYButton
          variant="secondary"
          onClick={() => setAddExerciseOpen(true)}
          className="min-h-12 w-full gap-2"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Add exercise
        </FOYButton>
      </div>

      <AddExerciseSheet
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        templateExercises={templateExercises}
        existingNames={existingNames}
        onSelectExercise={(name) => {
          setAddExerciseOpen(false);
          addExercise(name);
        }}
      />

      <RestTimerSheet
        visible={restTimer.visible}
        secondsLeft={restTimer.secondsLeft}
        onDismiss={restTimer.dismiss}
      />
    </FOYContainer>
  );
}
