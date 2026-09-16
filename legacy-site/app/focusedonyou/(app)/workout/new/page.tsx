"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { createFOYWorkout } from "@/lib/supabase/foyWorkout";
import {
  FOYContainer,
  FOYInput,
  FOYButton,
  FOYButtonLink,
  FOYBackLink,
} from "@/app/focusedonyou/_components";

const MIN_EXERCISES = 1;

export default function NewWorkoutPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addExercise() {
    setExercises((prev) => [...prev, ""]);
  }

  function removeExercise(i: number) {
    if (exercises.length <= 1) return;
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setExerciseAt(i: number, value: string) {
    setExercises((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name the workout.");
      return;
    }
    const names = exercises.map((s) => s.trim()).filter(Boolean);
    if (names.length < MIN_EXERCISES) {
      setError("Add at least one exercise.");
      return;
    }

    const supabase = getFOYSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in to save.");
      return;
    }
    setSaving(true);
    try {
      await createFOYWorkout(supabase, user.id, trimmedName, names);
      router.replace("/focusedonyou/workout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FOYContainer className="py-6">
      <div className="mb-4">
        <FOYBackLink href="/focusedonyou/workout" ariaLabel="Back to workouts">
          Back
        </FOYBackLink>
      </div>

      <h2 className="text-xl font-semibold text-[var(--text)]">New workout</h2>
      <p className="mt-1 text-sm text-[var(--textMuted)]">
        Name it and add exercises. You can reorder or edit later.
      </p>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-6">
        <div>
          <label htmlFor="workout-name" className="mb-1 block text-sm font-medium text-[var(--text)]">
            Workout name
          </label>
          <FOYInput
            id="workout-name"
            type="text"
            placeholder="e.g. Push Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text)]">Exercises</label>
            <button
              type="button"
              onClick={addExercise}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl text-sm text-[var(--ice)] transition-colors hover:bg-[var(--iceSoft)]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {exercises.map((value, i) => (
              <li key={i} className="flex gap-2">
                <FOYInput
                  type="text"
                  placeholder={`Exercise ${i + 1}`}
                  value={value}
                  onChange={(e) => setExerciseAt(i, e.target.value)}
                  disabled={saving}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(i)}
                  disabled={exercises.length <= 1 || saving}
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-[var(--textMuted)] transition-colors hover:bg-[var(--bg3)] hover:text-[var(--text)] disabled:opacity-50"
                  aria-label="Remove exercise"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <FOYButtonLink
            href="/focusedonyou/workout"
            variant="secondary"
            className="min-h-12 flex-1"
          >
            Cancel
          </FOYButtonLink>
          <FOYButton
            type="submit"
            variant="primary"
            disabled={saving}
            className="min-h-12 flex-1"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Saving…
              </span>
            ) : (
              "Save"
            )}
          </FOYButton>
        </div>
      </form>
    </FOYContainer>
  );
}
