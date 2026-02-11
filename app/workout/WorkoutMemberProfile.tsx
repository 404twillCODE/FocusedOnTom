"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Activity, Loader2 } from "lucide-react";
import { getProfileByUsername, getLogsByUser } from "@/lib/supabase/workout";
import type { Profile } from "@/lib/supabase/client";
const WORKOUT_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  cardio: "Cardio",
  other: "Other",
};

export function WorkoutMemberProfile({
  username,
  onClose,
}: {
  username: string | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<{ date: string; workout_type: string; duration_min: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) {
      setProfile(null);
      setLogs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const p = await getProfileByUsername(username);
        if (cancelled) return;
        setProfile(p ?? null);
        if (!p) {
          setLogs([]);
          return;
        }
        const l = await getLogsByUser(p.id, 30);
        if (cancelled) return;
        setLogs(
          l.map((x) => ({
            date: x.date,
            workout_type: x.workout_type,
            duration_min: x.duration_min ?? 0,
          }))
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!username) return null;

  const totalMinutes = logs.reduce((s, l) => s + l.duration_min, 0);
  const byType = logs.reduce(
    (acc, l) => {
      acc[l.workout_type] = (acc[l.workout_type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-2xl border border-[var(--border)] border-b-0 bg-[var(--bg2)] shadow-xl sm:rounded-2xl sm:border-b"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] p-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              {profile?.display_name ?? username}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--textMuted)] hover:bg-white/10 hover:text-[var(--text)]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
                <p className="text-sm text-[var(--textMuted)]">Loading…</p>
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-red-400">{error}</p>
            ) : !profile ? (
              <p className="py-8 text-center text-[var(--textMuted)]">User not found.</p>
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
                    <User className="h-7 w-7" />
                  </span>
                </div>
                <p className="mt-2 text-center text-sm text-[var(--textMuted)]">
                  @{profile.username}
                </p>
                <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <Activity className="h-4 w-4 text-[var(--ice)]" />
                  Last 30 days
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 p-3">
                    <p className="text-xl font-bold text-[var(--ice)]">{logs.length}</p>
                    <p className="text-xs text-[var(--textMuted)]">Workouts</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 p-3">
                    <p className="text-xl font-bold text-[var(--text)]">{totalMinutes}</p>
                    <p className="text-xs text-[var(--textMuted)]">Minutes</p>
                  </div>
                </div>
                {Object.keys(byType).length > 0 && (
                  <>
                    <p className="mt-4 text-xs font-medium text-[var(--textMuted)]">By type</p>
                    <ul className="mt-1 space-y-1">
                      {Object.entries(byType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <li
                            key={type}
                            className="flex justify-between text-sm text-[var(--text)]"
                          >
                            <span>{WORKOUT_LABELS[type] ?? type}</span>
                            <span className="text-[var(--textMuted)]">{count}</span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
