"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocalSession, LocalSet } from "@/lib/offline/types";
import { initDB } from "@/lib/offline/db";
import { startSyncLoop } from "@/lib/offline/sync";
import * as queue from "@/lib/offline/queue";
import * as logging from "@/lib/offline/logging";

const REST_TIMER_DEFAULT = 90;
const DEBOUNCE_MS = 500;

export type UseLiveSessionResult = {
  session: LocalSession | null;
  sets: LocalSet[];
  workoutName: string | null;
  templateExercises: { name: string; order_index: number }[];
  loading: boolean;
  notFound: boolean;
  addSet: (exerciseName: string) => Promise<void>;
  updateSet: (
    setId: string,
    payload: { reps?: number | null; weight?: number | null; done?: boolean }
  ) => Promise<void>;
  addExercise: (name: string) => Promise<void>;
  endSession: () => Promise<void>;
  restTimerDefault: number;
  addSetLoading: string | null;
  setAddSetLoading: (name: string | null) => void;
  ending: boolean;
};

export function useLiveSession(sessionId: string | null): UseLiveSessionResult {
  const router = useRouter();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [sets, setSets] = useState<LocalSet[]>([]);
  const [workoutName, setWorkoutName] = useState<string | null>(null);
  const [templateExercises, setTemplateExercises] = useState<
    { name: string; order_index: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ending, setEnding] = useState(false);
  const [addSetLoading, setAddSetLoading] = useState<string | null>(null);
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const initOnce = useRef(false);

  const loadFromLocal = useCallback(async () => {
    if (!sessionId) return;
    const [localSession, localSets, details] = await Promise.all([
      logging.getLocalSession(sessionId),
      logging.getLocalSets(sessionId),
      logging.getLocalSessionDetails(sessionId),
    ]);
    if (!localSession) {
      setNotFound(true);
      return;
    }
    setSession(localSession);
    setSets(localSets);
    setWorkoutName(details?.workoutName ?? null);
    setTemplateExercises(details?.templateExercises ?? []);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (!initOnce.current) {
          await initDB();
          startSyncLoop();
          initOnce.current = true;
        }
        await loadFromLocal();
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      debounceRef.current.forEach((t) => clearTimeout(t));
      debounceRef.current.clear();
    };
  }, [sessionId, loadFromLocal]);

  const addSet = useCallback(
    async (exerciseName: string) => {
      if (!sessionId) return;
      setAddSetLoading(exerciseName);
      try {
        const nextIndex = sets.filter((s) => s.exercise_name === exerciseName).length;
        const newSet = await logging.addSetLocal(sessionId, exerciseName, nextIndex);
        setSets((prev) => [...prev, newSet]);
      } finally {
        setAddSetLoading(null);
      }
    },
    [sessionId, sets]
  );

  const updateSet = useCallback(
    async (
      setId: string,
      payload: { reps?: number | null; weight?: number | null; done?: boolean }
    ) => {
      const isDoneToggle = payload.done !== undefined;
      if (isDoneToggle) {
        const updated = await logging.updateSetLocal(setId, payload);
        if (updated) {
          setSets((prev) =>
            prev.map((s) => (s.id === setId ? updated : s))
          );
        }
        return;
      }
      const updated = await logging.putSetLocal(setId, payload);
      if (updated) {
        setSets((prev) =>
          prev.map((s) => (s.id === setId ? updated : s))
        );
        const prevTimer = debounceRef.current.get(setId);
        if (prevTimer) clearTimeout(prevTimer);
        const t = setTimeout(async () => {
          debounceRef.current.delete(setId);
          const set = await logging.getLocalSet(setId);
          if (set) await queue.enqueueUpsertSet(set);
        }, DEBOUNCE_MS);
        debounceRef.current.set(setId, t);
      }
    },
    []
  );

  const existingNames = new Set(
    [...templateExercises.map((e) => e.name), ...sets.map((s) => s.exercise_name)]
  );

  const addExercise = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !sessionId) return;
      if (existingNames.has(trimmed)) return;
      setAddSetLoading(trimmed);
      try {
        const newSet = await logging.addSetLocal(sessionId, trimmed, 0);
        setSets((prev) => [...prev, newSet]);
      } finally {
        setAddSetLoading(null);
      }
    },
    [sessionId, existingNames]
  );

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    setEnding(true);
    await logging.endSessionLocal(sessionId);
    router.replace("/focusedonyou/workout");
  }, [sessionId, router]);

  return {
    session,
    sets,
    workoutName,
    templateExercises,
    loading,
    notFound,
    addSet,
    updateSet,
    addExercise,
    endSession,
    restTimerDefault: REST_TIMER_DEFAULT,
    addSetLoading,
    setAddSetLoading,
    ending,
  };
}
