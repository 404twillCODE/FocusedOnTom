"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, User, Loader2 } from "lucide-react";
import { getCommunityFeed } from "@/lib/supabase/workout";
import type { WorkoutLogWithProfile } from "@/lib/supabase/client";
const CATEGORY_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  cardio: "Cardio",
  other: "Other",
  rest: "Rest",
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export function WorkoutFeedTab({
  onSelectMember,
}: {
  onSelectMember: (username: string) => void;
}) {
  const [logs, setLogs] = useState<WorkoutLogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCommunityFeed()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load feed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading feed…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }
  if (logs.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--textMuted)]">
        <Dumbbell className="mx-auto h-10 w-10 opacity-50" />
        <p className="mt-2">No workouts yet. Be the first to log one.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3 pb-24">
      <AnimatePresence mode="popLayout">
        {logs.map((log, i) => {
          const profile = log.profiles;
          const displayName = profile?.display_name ?? "Unknown";
          const username = profile?.username ?? "";
          const categoryLabel = CATEGORY_LABELS[log.workout_type] ?? log.workout_type;
          const title = log.workout_name?.trim() || categoryLabel;
          const hasDetails =
            (log.reps != null && log.reps > 0) ||
            (log.sets != null && log.sets > 0) ||
            (log.lbs != null && log.lbs > 0);
          return (
            <motion.li
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => username && onSelectMember(username)}
                    className="flex items-center gap-2 text-left hover:opacity-90"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--iceSoft)] text-[var(--ice)]">
                      <User className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">
                        {displayName}
                      </p>
                      {username && (
                        <p className="text-xs text-[var(--textMuted)]">@{username}</p>
                      )}
                    </div>
                  </button>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                    <span className="font-medium text-[var(--ice)]">{title}</span>
                    {log.workout_name?.trim() && (
                      <span className="text-[var(--textMuted)]">
                        ({categoryLabel})
                      </span>
                    )}
                    {hasDetails && (
                      <span className="text-[var(--textMuted)]">
                        {[
                          log.sets != null && log.sets > 0 && `${log.sets}×`,
                          log.reps != null && log.reps > 0 && `${log.reps} reps`,
                          log.lbs != null && log.lbs > 0 && `${log.lbs} lbs`,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                    {(log.duration_min ?? 0) > 0 && (
                      <span className="text-[var(--textMuted)]">
                        {log.duration_min} min
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--textMuted)]">
                    {formatDate(log.date)}
                  </p>
                  {log.notes?.trim() && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--textMuted)]">
                      {log.notes.trim()}
                    </p>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
