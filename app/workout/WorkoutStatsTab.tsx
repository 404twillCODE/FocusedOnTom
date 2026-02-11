"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Activity, Loader2 } from "lucide-react";
import {
  getCommunityLeaderboard,
  getMyLogs,
  getAllProfiles,
} from "@/lib/supabase/workout";
import { cn } from "@/lib/cn";

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const start = monday.toISOString().slice(0, 10);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const end = sunday.toISOString().slice(0, 10);
  return { start, end };
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].map((d) => d).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expect = today;
  for (const d of sorted) {
    if (d !== expect) break;
    streak++;
    const next = new Date(expect);
    next.setDate(next.getDate() - 1);
    expect = next.toISOString().slice(0, 10);
  }
  return streak;
}

export function WorkoutStatsTab({ userId }: { userId: string }) {
  const [leaderboard, setLeaderboard] = useState<
    { user_id: string; count: number; minutes: number }[]
  >([]);
  const [profiles, setProfiles] = useState<Map<string, { display_name: string; username: string }>>(new Map());
  const [myLogs, setMyLogs] = useState<{ date: string; duration_min: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const { start, end } = getWeekBounds();
    let cancelled = false;
    Promise.all([
      getCommunityLeaderboard(start, end),
      getAllProfiles(),
      getMyLogs(userId),
    ])
      .then(([board, profs, logs]) => {
        if (cancelled) return;
        setLeaderboard(
          board.sort((a, b) => (b.count !== a.count ? b.count - a.count : b.minutes - a.minutes))
        );
        const map = new Map<string, { display_name: string; username: string }>();
        for (const p of profs) map.set(p.id, { display_name: p.display_name, username: p.username });
        setProfiles(map);
        setMyLogs(logs.map((l) => ({ date: l.date, duration_min: l.duration_min ?? 0 })));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stats.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading stats…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-400">{error}</div>
    );
  }

  const last7 = myLogs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    return diff < 7;
  });
  const last30 = myLogs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    return diff < 30;
  });
  const totalMinutes7 = last7.reduce((s, l) => s + l.duration_min, 0);
  const totalMinutes30 = last30.reduce((s, l) => s + l.duration_min, 0);
  const streak = computeStreak(myLogs.map((l) => l.date));

  return (
    <div className="space-y-8 pb-24">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <Activity className="h-5 w-5 text-[var(--ice)]" />
          My stats
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--ice)]">{streak}</p>
            <p className="text-xs text-[var(--textMuted)]">Day streak</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">{last7.length}</p>
            <p className="text-xs text-[var(--textMuted)]">Last 7 days</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">{last30.length}</p>
            <p className="text-xs text-[var(--textMuted)]">Last 30 days</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
          >
            <p className="text-2xl font-bold text-[var(--text)]">{totalMinutes30}</p>
            <p className="text-xs text-[var(--textMuted)]">Min (30d)</p>
          </motion.div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          <Trophy className="h-5 w-5 text-[var(--ice)]" />
          This week
        </h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-[var(--textMuted)]">No workouts this week yet.</p>
        ) : (
          <ul className="space-y-2">
            {leaderboard.slice(0, 10).map((row, i) => {
              const prof = profiles.get(row.user_id);
              const name = prof?.display_name ?? "Someone";
              const isMe = row.user_id === userId;
              return (
                <motion.li
                  key={row.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3",
                    isMe
                      ? "border-[var(--ice)]/40 bg-[var(--iceSoft)]/30"
                      : "border-[var(--border)] bg-[var(--bg2)]/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg3)] text-sm font-medium text-[var(--textMuted)]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--text)]">
                        {name}
                        {isMe && (
                          <span className="ml-1 text-xs text-[var(--ice)]">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--textMuted)]">
                        {row.count} workout{row.count !== 1 ? "s" : ""} · {row.minutes} min
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
