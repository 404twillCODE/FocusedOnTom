"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import {
  getSessionWithDetails,
  deleteSession,
  type WorkoutSession,
  type WorkoutSetRow,
} from "@/lib/supabase/workout";
import { Button } from "@/components/ui/button";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

type ExerciseWithSets = {
  id: string;
  name: string;
  sets: { set_number: number; reps: number | null; weight: number | null; is_drop_set?: boolean }[];
};

export function SessionDetail({
  sessionId,
  userId,
  units,
  onBack,
  onError,
}: {
  sessionId: string;
  userId: string;
  units: "lbs" | "kg";
  onBack: () => void;
  onError: (msg: string) => void;
}) {
  const [data, setData] = useState<{
    session: WorkoutSession;
    exercises: ExerciseWithSets[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSessionWithDetails(sessionId).then(({ session, exercises, sets }) => {
      if (cancelled) return;
      const byEx = new Map<string, ExerciseWithSets>();
      for (const ex of exercises) {
        byEx.set(ex.id, { id: ex.id, name: ex.name, sets: [] });
      }
      for (const s of sets as WorkoutSetRow[]) {
        const ex = byEx.get(s.exercise_id);
        if (ex)
          ex.sets.push({
            set_number: s.set_number,
            reps: s.reps,
            weight: s.weight != null ? Number(s.weight) : null,
            is_drop_set: s.is_drop_set ?? false,
          });
      }
      byEx.forEach((ex) => ex.sets.sort((a, b) => a.set_number - b.set_number));
      setData({
        session,
        exercises: Array.from(byEx.values()),
      });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleDelete() {
    if (!confirm("Delete this workout? This can't be undone.")) return;
    setDeleting(true);
    onError("");
    try {
      await deleteSession(sessionId, userId);
      onBack();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading…</p>
      </div>
    );
  }

  const { session, exercises: exList } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-[var(--textMuted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-5">
        <p className="text-sm text-[var(--textMuted)]">
          {formatDate(session.ended_at ?? session.started_at)}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text)]">
          {session.day_label ?? "Workout"}
        </h2>
        {session.duration_min != null && session.duration_min > 0 && (
          <p className="mt-0.5 text-sm text-[var(--textMuted)]">
            {session.duration_min} min
          </p>
        )}
        {session.notes?.trim() && (
          <p className="mt-2 text-sm text-[var(--text)]">{session.notes.trim()}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--textMuted)]">
          Exercises
        </h3>
        {exList.length === 0 ? (
          <p className="text-sm text-[var(--textMuted)]">No exercises logged.</p>
        ) : (
          exList.map((ex) => (
            <div
              key={ex.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4"
            >
              <p className="font-medium text-[var(--text)]">{ex.name}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-[var(--textMuted)]">
                {ex.sets.map((s, j) => (
                  <li key={j}>
                    Set {s.set_number}
                    {s.is_drop_set && " (drop)"}: {s.reps ?? "—"} reps
                    {s.weight != null ? ` · ${s.weight} ${units}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <Button
        variant="outline"
        className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete workout
          </>
        )}
      </Button>
    </motion.div>
  );
}
