"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getWorkoutSettings,
  getActiveSession,
  getSessionWithDetails,
  startWorkoutSession,
  type WorkoutSettings,
  type WorkoutSession,
  type WorkoutSetRow,
} from "@/lib/supabase/workout";
import { SetupWizard } from "./SetupWizard";
import { WorkoutHome } from "./WorkoutHome";
import { WorkoutTypePicker } from "./WorkoutTypePicker";
import { ActiveSession } from "./ActiveSession";
import { SessionDetail } from "./SessionDetail";
import type { LocalExercise } from "./types";

const DEFAULT_MODES = {
  progressiveOverload: true,
  dropSets: false,
  rpe: false,
  supersets: false,
  amrap: false,
};

const DEFAULT_PREFS = {
  timer_enabled: false,
  timer_default_sec: 90,
  units: "lbs" as const,
  show_suggestions: true,
};

type View = "loading" | "setup" | "home" | "typePicker" | "active" | "detail";

function buildLocalExercises(
  exRows: { id: string; name: string }[],
  setRows: WorkoutSetRow[]
): LocalExercise[] {
  const byEx = new Map<string, LocalExercise>();
  for (const ex of exRows) {
    byEx.set(ex.id, { id: ex.id, name: ex.name, sets: [] });
  }
  for (const s of setRows) {
    const ex = byEx.get(s.exercise_id);
    if (ex)
      ex.sets.push({
        id: `${ex.id}-${s.set_number}`,
        set_number: s.set_number,
        reps: s.reps,
        weight: s.weight != null ? Number(s.weight) : null,
        is_done: s.is_done ?? false,
        is_drop_set: s.is_drop_set ?? false,
        drop_set_level: s.drop_set_level,
        rpe: s.rpe != null ? Number(s.rpe) : null,
      });
  }
  const list = Array.from(byEx.values()).sort(
    (a, b) =>
      exRows.findIndex((e) => e.id === a.id) - exRows.findIndex((e) => e.id === b.id)
  );
  list.forEach((ex) => ex.sets.sort((a, b) => a.set_number - b.set_number));
  return list;
}

export function WorkoutTab({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("loading");
  const [settings, setSettings] = useState<WorkoutSettings | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typePickerCreating, setTypePickerCreating] = useState(false);
  const activeIdRef = useRef<string | null>(null);

  const activeSessionId = activeSession?.id ?? null;

  useEffect(() => {
    activeIdRef.current = activeSession?.id ?? null;
  }, [activeSession]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([getWorkoutSettings(userId), getActiveSession(userId)])
      .then(([s, session]) => {
        if (cancelled) return;
        setSettings(s ?? null);
        setActiveSession(session);

        if (!s || !s.setup_completed) {
          setView("setup");
          setExercises([]);
          return;
        }

        if (session) {
          const sid = session.id;
          getSessionWithDetails(sid).then(({ exercises: exRows, sets: setRows }) => {
            if (cancelled) return;
            const list = buildLocalExercises(exRows, setRows as WorkoutSetRow[]);
            if (activeIdRef.current === sid) setExercises(list);
          }).catch(() => {
            if (!cancelled && activeIdRef.current === sid) setExercises([]);
          });
          setView("active");
        } else {
          setExercises([]);
          setView("home");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setView("setup");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const modes = settings?.modes ?? DEFAULT_MODES;
  const prefs = settings?.preferences ?? DEFAULT_PREFS;

  async function loadActiveSessionIntoState() {
    const session = await getActiveSession(userId);
    setActiveSession(session);
    if (session) {
      const { exercises: exRows, sets: setRows } = await getSessionWithDetails(session.id);
      setExercises(buildLocalExercises(exRows, setRows as WorkoutSetRow[]));
    } else {
      setExercises([]);
    }
    setView("active");
  }

  async function handleTypePickerSelect(dayLabel: string, templateId: string | null) {
    setError(null);
    setTypePickerCreating(true);
    try {
      await startWorkoutSession({ userId, dayLabel, templateId });
      await loadActiveSessionIntoState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setTypePickerCreating(false);
    }
  }

  function handleFinish() {
    setActiveSession(null);
    setExercises([]);
    setView("home");
  }

  if (view === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {activeSessionId != null && activeSession && settings ? (
        <ActiveSession
          session={activeSession}
          exercises={exercises}
          setExercises={setExercises}
          units={prefs.units}
          modes={modes}
          preferences={prefs}
          userId={userId}
          onFinish={handleFinish}
          onError={setError}
        />
      ) : view === "setup" ? (
        <SetupWizard
          userId={userId}
          existing={settings}
          onDone={(s) => {
            setSettings(s);
            setView("home");
          }}
          onError={setError}
        />
      ) : view === "detail" && detailSessionId ? (
        <SessionDetail
          sessionId={detailSessionId}
          userId={userId}
          units={prefs.units}
          onBack={() => {
            setDetailSessionId(null);
            setView("home");
          }}
          onError={setError}
        />
      ) : view === "typePicker" ? (
        <WorkoutTypePicker
          userId={userId}
          onSelect={handleTypePickerSelect}
          onBack={() => setView("home")}
          onError={setError}
          isCreating={typePickerCreating}
        />
      ) : view === "home" && settings ? (
        <WorkoutHome
          userId={userId}
          settings={settings}
          onStarted={loadActiveSessionIntoState}
          onStartCustom={() => setView("typePicker")}
          onOpenSession={(id) => {
            setDetailSessionId(id);
            setView("detail");
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
