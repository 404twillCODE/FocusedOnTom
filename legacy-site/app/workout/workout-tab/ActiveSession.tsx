"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Loader2, Timer } from "lucide-react";
import {
  finishWorkoutSession,
  getExerciseHistoryForNames,
  type WorkoutSession,
  type WorkoutModes,
  type ExerciseHistory,
} from "@/lib/supabase/workout";
import { Button } from "@/components/ui/button";
import type { LocalExercise, LocalSet } from "./types";
import { DEFAULT_DROP_PERCENT } from "./types";
import { useToast } from "../AppToast";

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ActiveSession({
  session,
  exercises,
  setExercises,
  units,
  modes,
  preferences,
  userId,
  onFinish,
  onError,
}: {
  session: WorkoutSession;
  exercises: LocalExercise[];
  setExercises: (ex: LocalExercise[] | ((prev: LocalExercise[]) => LocalExercise[])) => void;
  units: "lbs" | "kg";
  modes: WorkoutModes;
  preferences: { timer_enabled?: boolean; timer_default_sec?: number | null };
  userId: string;
  onFinish: () => void;
  onError: (msg: string) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [historyMap, setHistoryMap] = useState<Map<string, ExerciseHistory>>(new Map());
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const addExerciseInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const startedAt = new Date(session.started_at).getTime();

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    const names = exercises.map((e) => e.name).filter(Boolean);
    if (names.length === 0) return;
    getExerciseHistoryForNames(userId, names).then(setHistoryMap);
  }, [userId, exercises.map((e) => e.name).join(",")]);

  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      // Timer finished - vibrate phone + in-app toast
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      showToast("Rest timer complete! Time to go.", "timer", 4000);
      setRestRemaining(null);
      return;
    }
    const id = setTimeout(() => setRestRemaining((r) => (r != null ? r - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [restRemaining]);

  function addExercise(name: string) {
    const n = (name || "Exercise").trim();
    const id = `ex-${Date.now()}`;
    setExercises((prev) => [
      ...prev,
      {
        id,
        name: n,
        sets: [
          {
            id: `${id}-1`,
            set_number: 1,
            reps: null,
            weight: null,
            is_done: false,
            is_drop_set: false,
            drop_set_level: null,
            rpe: null,
          },
        ],
      },
    ]);
    setNewName("");
  }

  function removeExercise(exId: string) {
    setExercises((prev) => prev.filter((e) => e.id !== exId));
  }

  function addSet(exId: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        const next = e.sets.length + 1;
        const last = e.sets[next - 2];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: `${e.id}-${next}`,
              set_number: next,
              reps: last?.reps ?? null,
              weight: last?.weight ?? null,
              is_done: false,
              is_drop_set: false,
              drop_set_level: null,
              rpe: last?.rpe ?? null,
            },
          ],
        };
      })
    );
  }

  function addDropSet(exId: string) {
    const ex = exercises.find((e) => e.id === exId);
    if (!ex || ex.sets.length === 0) return;
    const lastSet = ex.sets[ex.sets.length - 1];
    const lastWeight = lastSet.weight ?? 0;
    const reduced = lastWeight * (1 - DEFAULT_DROP_PERCENT / 100);
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        const level = Math.max(1, (ex.sets.filter((s) => s.is_drop_set).length ?? 0) + 1);
        const nextNum = ex.sets.length + 1;
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: `${e.id}-${nextNum}`,
              set_number: nextNum,
              reps: lastSet.reps,
              weight: Math.round(reduced * 10) / 10,
              is_done: false,
              is_drop_set: true,
              drop_set_level: level,
              rpe: null,
            },
          ],
        };
      })
    );
  }

  function updateSet(
    exId: string,
    setId: string,
    patch: Partial<Pick<LocalSet, "reps" | "weight" | "is_done" | "rpe">>
  ) {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, ...patch } : s
              ),
            }
          : e
      )
    );
  }

  function startRest() {
    const sec = preferences.timer_default_sec ?? 90;
    setRestRemaining(sec);
  }

  async function handleFinish() {
    if (exercises.length === 0 && !window.confirm("No exercises logged. Finish anyway?")) return;
    const durationMin = Math.round(
      (Date.now() - new Date(session.started_at).getTime()) / 60_000
    );
    setSaving(true);
    onError("");
    try {
      await finishWorkoutSession({
        userId,
        sessionId: session.id,
        notes: notes || undefined,
        durationMin,
        exercises: exercises.map((e) => ({
          name: e.name,
          sets: e.sets.map((s) => ({
            set_number: s.set_number,
            reps: s.reps,
            weight: s.weight,
            is_done: s.is_done,
            is_drop_set: s.is_drop_set,
            drop_set_level: s.drop_set_level,
            rpe: s.rpe,
          })),
        })),
        modes,
      });
      onFinish();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  const defaultRestSec = preferences.timer_default_sec ?? 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-0 flex-col pb-32"
    >
      <div className="shrink-0 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text)]">
            {session.day_label ?? "Workout"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-[var(--textMuted)]">
            <Timer className="h-4 w-4" />
            <span>{formatElapsed(elapsed)}</span>
          </div>
        </div>
        {restRemaining !== null && restRemaining > 0 && (
          <div className="rounded-xl bg-[var(--iceSoft)]/50 px-3 py-2 text-center">
            <span className="text-lg font-medium text-[var(--ice)]">
              Rest: {restRemaining}s
            </span>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-4">
        {exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg3)]/30 p-6 text-center">
            <p className="text-sm font-medium text-[var(--text)]">No exercises yet</p>
            <p className="mt-1 text-xs text-[var(--textMuted)]">
              Add an exercise below to log sets, reps and weight.
            </p>
          </div>
        )}

        {exercises.map((ex) => {
          const hist = historyMap.get(ex.name);
          return (
            <div
              key={ex.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-[var(--text)]">{ex.name}</p>
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  className="rounded-lg p-1.5 text-[var(--textMuted)] hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Remove exercise"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {modes.progressiveOverload && hist && (hist.last_weight != null || hist.next_weight != null) && (
                <div className="mb-3 rounded-xl bg-[var(--bg3)]/60 px-3 py-2 text-xs">
                  {hist.last_weight != null && (
                    <span className="text-[var(--textMuted)]">
                      Last: {hist.last_weight} {units} × {hist.last_reps ?? "—"}
                    </span>
                  )}
                  {hist.next_weight != null && (
                    <span className="ml-2 text-[var(--ice)]">
                      Suggested: {hist.next_weight} {units} × {hist.next_reps ?? "—"}
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {ex.sets.map((set) => (
                  <div
                    key={set.id}
                    className={`flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 ${
                      set.is_drop_set ? "bg-[var(--iceSoft)]/20" : "bg-[var(--bg3)]/60"
                    }`}
                  >
                    <span className="w-6 text-xs text-[var(--textMuted)]">
                      {set.set_number}
                      {set.is_drop_set && "↓"}
                    </span>
                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.reps ?? ""}
                      onChange={(e) =>
                        updateSet(ex.id, set.id, {
                          reps: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      className="h-9 w-14 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-sm focus:border-[var(--ice)]/50 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder={units}
                      value={set.weight ?? ""}
                      onChange={(e) =>
                        updateSet(ex.id, set.id, {
                          weight: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      className="h-9 w-16 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-sm focus:border-[var(--ice)]/50 focus:outline-none"
                    />
                    {modes.rpe && (
                      <input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="RPE"
                        value={set.rpe ?? ""}
                        onChange={(e) =>
                          updateSet(ex.id, set.id, {
                            rpe: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        className="h-9 w-12 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-sm focus:border-[var(--ice)]/50 focus:outline-none"
                      />
                    )}
                    {preferences.timer_enabled && (
                      <button
                        type="button"
                        onClick={startRest}
                        className="flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-xs text-[var(--textMuted)] hover:text-[var(--ice)]"
                      >
                        <Timer className="h-3.5 w-3.5" />
                        {defaultRestSec}s
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        updateSet(ex.id, set.id, { is_done: !set.is_done })
                      }
                      className={`ml-auto h-9 w-9 shrink-0 rounded-full border-2 text-sm ${
                        set.is_done
                          ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
                          : "border-[var(--border)] text-[var(--textMuted)]"
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[var(--border)] bg-transparent text-[var(--text)]"
                  onClick={() => addSet(ex.id)}
                >
                  + Set
                </Button>
                {modes.dropSets && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-[var(--border)] bg-transparent text-[var(--text)]"
                    onClick={() => addDropSet(ex.id)}
                  >
                    + Drop set
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="space-y-2">
          <textarea
            rows={2}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm focus:border-[var(--ice)]/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg)]/95 px-4 pb-6 pt-4 backdrop-blur-sm">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/80 p-3">
          <p className="mb-2 text-xs font-medium text-[var(--textMuted)]">Add exercise</p>
          <div className="flex gap-2">
            <input
              ref={addExerciseInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bench press"
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2 text-sm focus:border-[var(--ice)]/50 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExercise(newName);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-[var(--border)] bg-transparent"
              onClick={() => addExercise(newName)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={saving}
          onClick={handleFinish}
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Finish workout
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
