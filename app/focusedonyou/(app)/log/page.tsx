"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Loader2, WifiOff, Cloud, Check } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import {
  listRecentSessions,
  getFOYSessionSetsBatch,
  getFOYWorkoutNamesByIds,
} from "@/lib/supabase/foyWorkout";
import type { LocalSession } from "@/lib/offline/types";
import { initDB } from "@/lib/offline/db";
import { startSyncLoop } from "@/lib/offline/sync";
import {
  getLocalSessions,
  getLocalSessionDetails,
  mergeRemoteSessionsIntoLocal,
} from "@/lib/offline/logging";
import type { SessionSyncStatus } from "@/lib/offline/sync";
import { getSessionSyncStatus } from "@/lib/offline/sync";
import {
  FOYContainer,
  FOYCard,
  FOYEmptyState,
  FOYButtonLink,
} from "@/app/focusedonyou/_components";

const SESSIONS_LIMIT = 30;

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return `Today ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `Yesterday ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(started: string, ended: string | null): string {
  const start = new Date(started).getTime();
  const end = ended ? new Date(ended).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function SyncBadge({ status }: { status: SessionSyncStatus }) {
  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
        <WifiOff className="h-3 w-3" aria-hidden />
        Offline
      </span>
    );
  }
  if (status === "syncing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--iceSoft)] px-2 py-0.5 text-[10px] font-medium text-[var(--ice)]">
        <Cloud className="h-3 w-3 animate-pulse" aria-hidden />
        Syncing…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg3)]/80 px-2 py-0.5 text-[10px] text-[var(--textMuted)]">
      <Check className="h-3 w-3 text-emerald-500" aria-hidden />
      Synced
    </span>
  );
}

export default function LogPage() {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [detailsBySessionId, setDetailsBySessionId] = useState<
    Record<string, { workoutName: string | null }>
  >({});
  const [syncStatusBySessionId, setSyncStatusBySessionId] = useState<
    Record<string, SessionSyncStatus>
  >({});
  const [loading, setLoading] = useState(true);
  const [initDone, setInitDone] = useState(false);

  const loadLocal = useCallback(async () => {
    const list = await getLocalSessions(SESSIONS_LIMIT);
    setSessions(list);
    const details: Record<string, { workoutName: string | null }> = {};
    const statuses: Record<string, SessionSyncStatus> = {};
    await Promise.all(
      list.map(async (s) => {
        const [d, status] = await Promise.all([
          getLocalSessionDetails(s.id),
          getSessionSyncStatus(s.id),
        ]);
        details[s.id] = { workoutName: d?.workoutName ?? null };
        statuses[s.id] = status;
      })
    );
    setDetailsBySessionId(details);
    setSyncStatusBySessionId(statuses);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        startSyncLoop();
        if (!cancelled) await loadLocal();
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLocal]);

  useEffect(() => {
    if (!initDone || !navigator.onLine) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = getFOYSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const remoteSessions = await listRecentSessions(
          supabase,
          user.id,
          SESSIONS_LIMIT
        );
        if (cancelled || remoteSessions.length === 0) return;
        const sessionIds = remoteSessions.map((s) => s.id);
        const [remoteSets, nameMap] = await Promise.all([
          getFOYSessionSetsBatch(supabase, sessionIds),
          getFOYWorkoutNamesByIds(
            supabase,
            [...new Set(remoteSessions.map((s) => s.workout_id).filter(Boolean))] as string[]
          ),
        ]);
        if (cancelled) return;
        const setsForMerge = new Map<string, import("@/lib/offline/types").LocalSet[]>();
        for (const set of remoteSets) {
          const sid = set.session_id;
          const arr = setsForMerge.get(sid) ?? [];
          arr.push({
            id: set.id,
            session_id: sid,
            exercise_name: set.exercise_name,
            set_index: set.set_index,
            reps: set.reps,
            weight: set.weight,
            notes: set.notes,
            done: set.done,
            updated_at: (set as { updated_at?: string }).updated_at ?? new Date().toISOString(),
          });
          setsForMerge.set(sid, arr);
        }
        await mergeRemoteSessionsIntoLocal(
          remoteSessions,
          setsForMerge,
          nameMap
        );
        if (!cancelled) await loadLocal();
      } catch {
        // Non-blocking; ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initDone, loadLocal]);

  if (loading) {
    return (
      <FOYContainer className="py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" aria-hidden />
        </div>
      </FOYContainer>
    );
  }

  if (sessions.length === 0) {
    return (
      <FOYContainer className="py-8">
        <FOYEmptyState
          icon={ClipboardList}
          title="No logs yet"
          description="Your workout history will show up here after you log sets."
        >
          <FOYButtonLink href="/focusedonyou/workout" variant="primary">
            Log a workout
          </FOYButtonLink>
        </FOYEmptyState>
      </FOYContainer>
    );
  }

  return (
    <FOYContainer className="py-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Recent sessions</h2>
      <ul className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/focusedonyou/log/live?sessionId=${session.id}`}
              className="block"
            >
              <FOYCard className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--text)]">
                    {detailsBySessionId[session.id]?.workoutName ?? "Quick Session"}
                  </p>
                  <p className="text-sm text-[var(--textMuted)]">
                    {formatSessionDate(session.started_at)}
                    {" · "}
                    {session.ended_at
                      ? formatDuration(session.started_at, session.ended_at)
                      : "In progress"}
                  </p>
                </div>
                <SyncBadge status={syncStatusBySessionId[session.id] ?? "synced"} />
              </FOYCard>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <FOYButtonLink href="/focusedonyou/workout" variant="secondary">
          Start a workout
        </FOYButtonLink>
      </div>
    </FOYContainer>
  );
}
