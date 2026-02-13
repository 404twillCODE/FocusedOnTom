"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, User, Loader2, ChevronDown, Trash2 } from "lucide-react";
import { getCommunityFeed, getReactionsForLogs, toggleReaction, type ReactionSummary } from "@/lib/supabase/workout";
import { supabase } from "@/lib/supabase/client";
import type { WorkoutLogWithProfile } from "@/lib/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  cardio: "Cardio",
  other: "Other",
  rest: "Rest",
};

const REACTION_EMOJIS = ["💪", "🔥", "👏", "⭐", "💯"];

type ParsedExercise = {
  name: string;
  sets: { r: number; w: number | null; done?: boolean }[];
};

function parseExerciseDetails(notes: string | null | undefined): ParsedExercise[] | null {
  if (!notes?.trim()) return null;
  try {
    const parsed = JSON.parse(notes);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "object" &&
      parsed[0] !== null &&
      "name" in parsed[0] &&
      "sets" in parsed[0]
    ) {
      return parsed as ParsedExercise[];
    }
  } catch {
    // Not JSON
  }
  return null;
}

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

// ---------- Feed entry card (stats-style, expandable) ----------

function FeedEntryCard({
  log,
  isAdmin,
  deletingId,
  reactions,
  onSelectMember,
  onAdminDelete,
  onToggleReaction,
}: {
  log: WorkoutLogWithProfile;
  isAdmin: boolean;
  deletingId: string | null;
  reactions: ReactionSummary[];
  onSelectMember: (username: string) => void;
  onAdminDelete: (logId: string) => void;
  onToggleReaction: (logId: string, emoji: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const profile = log.profiles;
  const username = profile?.username ?? "";
  const displayName = (profile?.display_name && profile.display_name !== "-") ? profile.display_name : (username || "Unknown");
  const categoryLabel = CATEGORY_LABELS[log.workout_type] ?? log.workout_type;
  const title = log.workout_name?.trim() || categoryLabel;
  const exerciseDetails = parseExerciseDetails(log.notes);
  const hasStats =
    (log.reps != null && log.reps > 0) ||
    (log.sets != null && log.sets > 0) ||
    (log.lbs != null && log.lbs > 0);
  const textNotes = exerciseDetails ? null : log.notes?.trim();
  const exerciseCount = exerciseDetails?.length ?? 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 overflow-hidden">
      {/* Header: user info + workout summary - tap to expand */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 min-w-0 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg3)]/20"
        >
          {/* Avatar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              username && onSelectMember(username);
            }}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--iceSoft)] text-[var(--ice)] hover:opacity-80"
          >
            <User className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            {/* Name + username */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[var(--text)] text-sm truncate">{displayName}</span>
              {username && (
                <span className="text-xs text-[var(--textMuted)] shrink-0">@{username}</span>
              )}
            </div>

            {/* Workout type + date */}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--textMuted)]">
              <span className="font-medium text-[var(--ice)]">{title}</span>
              <span>·</span>
              <span>{formatDate(log.date)}</span>
            </div>

            {/* Quick stats */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-[var(--textMuted)]">
              {exerciseCount > 0 && (
                <span>{exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}</span>
              )}
              {log.sets != null && log.sets > 0 && (
                <span>{log.sets} sets</span>
              )}
              {log.reps != null && log.reps > 0 && (
                <span>{log.reps} reps</span>
              )}
              {log.lbs != null && log.lbs > 0 && (
                <span>{log.lbs} lbs</span>
              )}
              {(log.duration_min ?? 0) > 0 && (
                <span>{log.duration_min} min</span>
              )}
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 mt-1 text-[var(--textMuted)] transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Admin delete */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onAdminDelete(log.id)}
            disabled={deletingId === log.id}
            className="shrink-0 mr-3 rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            aria-label="Delete feed entry"
          >
            {deletingId === log.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Expanded: exercise details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-2">
              {exerciseDetails && exerciseDetails.length > 0 ? (
                exerciseDetails.map((ex, ei) => {
                  const isExExpanded = expandedExercise === ei;
                  const totalSets = ex.sets.length;
                  return (
                    <div
                      key={ei}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg3)]/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedExercise(isExExpanded ? null : ei)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--bg3)]/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Dumbbell className="h-3.5 w-3.5 shrink-0 text-[var(--ice)]" />
                          <span className="text-sm font-medium text-[var(--text)] truncate">
                            {ex.name}
                          </span>
                          <span className="shrink-0 text-xs text-[var(--textMuted)]">
                            {totalSets} set{totalSets !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 text-[var(--textMuted)] transition-transform duration-200 ${
                            isExExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isExExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[var(--border)] px-3 py-2 space-y-1">
                              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-[var(--textMuted)]">
                                <span className="w-5 text-center">Set</span>
                                <span className="w-14">Reps</span>
                                <span className="w-16">Weight</span>
                                <span className="ml-auto">Done</span>
                              </div>
                              {ex.sets.map((set, si) => (
                                <div key={si} className="flex items-center gap-3 text-xs">
                                  <span className="w-5 text-center text-[var(--textMuted)]">{si + 1}</span>
                                  <span className="w-14 text-[var(--text)]">{set.r} reps</span>
                                  <span className="w-16 text-[var(--textMuted)]">
                                    {set.w != null && set.w > 0 ? `${set.w} lbs` : "—"}
                                  </span>
                                  <span className="ml-auto">
                                    {set.done ? (
                                      <span className="text-[var(--ice)]">✓</span>
                                    ) : (
                                      <span className="text-[var(--textMuted)]">—</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : hasStats ? (
                <p className="text-xs text-[var(--textMuted)]">
                  {[
                    log.sets != null && log.sets > 0 && `${log.sets} sets`,
                    log.reps != null && log.reps > 0 && `${log.reps} reps`,
                    log.lbs != null && log.lbs > 0 && `${log.lbs} lbs avg`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : (
                <p className="text-xs text-[var(--textMuted)]">No exercise details recorded.</p>
              )}

              {textNotes && (
                <p className="text-sm text-[var(--textMuted)]">{textNotes}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline emoji reactions - always visible */}
      <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-1">
        {REACTION_EMOJIS.map((emoji) => {
          const r = reactions.find((rx) => rx.emoji === emoji);
          const count = r?.count ?? 0;
          const reacted = r?.reacted ?? false;

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggleReaction(log.id, emoji)}
              className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-sm transition-colors ${
                reacted
                  ? "bg-[var(--iceSoft)]/50 border border-[var(--ice)]/40"
                  : "hover:bg-[var(--bg3)]/60 border border-transparent"
              }`}
            >
              <span className="text-base">{emoji}</span>
              {count > 0 && (
                <span className={`text-[11px] font-medium ${reacted ? "text-[var(--ice)]" : "text-[var(--textMuted)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Main feed tab ----------

export function WorkoutFeedTab({
  userId,
  onSelectMember,
}: {
  userId: string;
  onSelectMember: (username: string) => void;
}) {
  const [logs, setLogs] = useState<WorkoutLogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reactionsMap, setReactionsMap] = useState<Map<string, ReactionSummary[]>>(new Map());
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadReactions = useCallback(
    async (logIds: string[]) => {
      if (logIds.length === 0) return;
      const map = await getReactionsForLogs(logIds, userId);
      setReactionsMap(map);
    },
    [userId]
  );

  useEffect(() => {
    // Check admin status via server (linked to email in app_admins table)
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch("/api/workout/check-admin", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({ admin: false }));
        if (data.admin) setIsAdmin(true);
      } catch {
        // non-critical
      }
    })();
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    getCommunityFeed()
      .then(async (data) => {
        if (cancelled) return;
        setLogs(data);
        const logIds = data.map((l) => l.id);
        await loadReactions(logIds);
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
  }, [userId, loadReactions]);

  const handleAdminDelete = async (logId: string) => {
    if (!window.confirm("Delete this feed entry? This cannot be undone.")) return;
    setDeletingId(logId);
    try {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch("/api/workout/admin-delete-log", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== logId));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleReaction = async (logId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const next = new Map(prev);
      const current = next.get(logId) ?? [];
      const existing = current.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.reacted) {
          const newCount = existing.count - 1;
          if (newCount <= 0) {
            next.set(logId, current.filter((r) => r.emoji !== emoji));
          } else {
            next.set(logId, current.map((r) => r.emoji === emoji ? { ...r, count: newCount, reacted: false } : r));
          }
        } else {
          next.set(logId, current.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r));
        }
      } else {
        next.set(logId, [...current, { emoji, count: 1, reacted: true }]);
      }
      return next;
    });
    await toggleReaction(logId, userId, emoji);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading feed…</p>
      </div>
    );
  }
  if (error) {
    return <div className="py-8 text-center text-sm text-red-400">{error}</div>;
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
    <div className="space-y-3 pb-24">
      {logs.map((log, i) => (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <FeedEntryCard
            log={log}
            isAdmin={isAdmin}
            deletingId={deletingId}
            reactions={reactionsMap.get(log.id) ?? []}
            onSelectMember={onSelectMember}
            onAdminDelete={handleAdminDelete}
            onToggleReaction={handleToggleReaction}
          />
        </motion.div>
      ))}
    </div>
  );
}
