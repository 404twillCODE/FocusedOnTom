"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import {
  getMySessions,
  getSuggestedToday,
  startWorkoutSession,
  type WorkoutSession,
  type WorkoutSettings,
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

const RECENT_LIMIT = 10;

export function WorkoutHome({
  userId,
  settings,
  onStarted,
  onStartCustom,
  onOpenSession,
  onError,
}: {
  userId: string;
  settings: WorkoutSettings;
  onStarted: () => void;
  onStartCustom: () => void;
  onOpenSession: (sessionId: string) => void;
  onError: (msg: string) => void;
}) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const suggested = getSuggestedToday(settings);

  useEffect(() => {
    let cancelled = false;
    getMySessions(userId, RECENT_LIMIT)
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleStartSuggested() {
    if (!suggested) return;
    setStarting(true);
    onError("");
    try {
      await startWorkoutSession({
        userId,
        dayLabel: suggested.label,
        templateId: suggested.templateId ?? null,
      });
      onStarted();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setStarting(false);
    }
  }

  function handleStartCustom() {
    onError("");
    onStartCustom();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text)]">Workout</h2>
        <p className="mt-1 text-sm text-[var(--textMuted)]">
          Start a session and log your exercises.
        </p>
      </div>

      <div className="space-y-4">
        {suggested && settings.preferences?.show_suggestions !== false && (
          <div className="rounded-2xl border-2 border-[var(--ice)]/50 bg-[var(--iceSoft)]/20 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ice)]">
              Suggested today
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--text)]">
              {suggested.label}
            </p>
            <p className="mt-0.5 text-sm text-[var(--textMuted)]">
              Preloaded with today’s exercises from your plan.
            </p>
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={handleStartSuggested}
              disabled={starting}
            >
              {starting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Start {suggested.label}
                </>
              )}
            </Button>
          </div>
        )}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-5">
          <p className="text-sm font-medium text-[var(--text)]">Not following the plan?</p>
          <p className="mt-0.5 text-xs text-[var(--textMuted)]">
            Pick a focus (Push, Pull, etc.) or add exercises from scratch.
          </p>
          <Button
            className="mt-4 w-full border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--bg3)]"
            size="lg"
            variant="outline"
            onClick={handleStartCustom}
          >
            <Plus className="mr-2 h-5 w-5" />
            Start custom workout
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--textMuted)]">
          Recent workouts
        </h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-8 text-center text-sm text-[var(--textMuted)]">
            No workouts yet. Start one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpenSession(s.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 px-4 py-4 text-left transition-colors hover:border-[var(--ice)]/40"
                >
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      {s.day_label ?? "Workout"}
                    </p>
                    <p className="text-sm text-[var(--textMuted)]">
                      {formatDate(s.ended_at ?? s.started_at)}
                      {s.duration_min != null && s.duration_min > 0 &&
                        ` · ${s.duration_min} min`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--textMuted)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
