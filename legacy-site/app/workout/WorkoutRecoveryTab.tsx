"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { loadAppData } from "./workout-tab/getfit/dataStore";
import { type WorkoutHistoryEntry } from "./workout-tab/getfit/storage";
import { subscribe } from "@/lib/workoutLocalFirst";
import { type ExerciseCategory, type HistoryExercise } from "@/types/workout";

const RECOVERY_HOURS: Partial<Record<ExerciseCategory, number>> = {
  chest: 48,
  back: 72,
  legs: 72,
  core: 24,
  shoulders: 48,
  biceps: 24,
  triceps: 48,
  forearms: 24,
  arms: 48,
};

const CATEGORY_ALIASES: Record<string, ExerciseCategory> = {
  abs: "core",
};

const MUSCLE_ORDER = [
  "chest",
  "back",
  "legs",
  "core",
  "biceps",
  "shoulders",
  "triceps",
  "forearms",
] as const;

type MuscleCategory = (typeof MUSCLE_ORDER)[number];

const MUSCLE_META: Record<
  MuscleCategory,
  { label: string; image: string }
> = {
  chest: { label: "Chest", image: "/workout/muscles/chest.png" },
  back: { label: "Back", image: "/workout/muscles/back.png" },
  legs: { label: "Legs", image: "/workout/muscles/legs.png" },
  core: { label: "Core", image: "/workout/muscles/core.png" },
  biceps: { label: "Biceps", image: "/workout/muscles/biceps.png" },
  shoulders: { label: "Shoulders", image: "/workout/muscles/shoulders.png" },
  triceps: { label: "Triceps", image: "/workout/muscles/triceps.png" },
  forearms: { label: "Forearms", image: "/workout/muscles/forearms.png" },
};

type RecoveryItem = {
  category: MuscleCategory;
  label: string;
  hours: number;
  lastHitMs: number | null;
  hasHistory: boolean;
  remainingMs: number;
};

function toMs(entry: WorkoutHistoryEntry): number {
  if (typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp)) {
    return entry.timestamp;
  }
  const parsed = Date.parse(`${entry.date}T12:00:00`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCategory(value: unknown): ExerciseCategory | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!key) return null;
  if (key in CATEGORY_ALIASES) return CATEGORY_ALIASES[key];
  if (key in RECOVERY_HOURS) return key as ExerciseCategory;
  return null;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "Recovered";
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function formatLastHit(ms: number | null): string {
  if (!ms) return "Not trained yet";
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function expandToMuscleCategories(value: unknown): MuscleCategory[] {
  const normalized = normalizeCategory(value);
  if (!normalized) return [];
  if (normalized === "arms") return ["biceps", "triceps", "forearms"];
  if ((MUSCLE_ORDER as readonly string[]).includes(normalized)) {
    return [normalized as MuscleCategory];
  }
  return [];
}

export function WorkoutRecoveryTab({ userId }: { userId: string }) {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    loadAppData(userId)
      .then((data) => {
        if (!mounted) return;
        setHistory(data.workoutHistory ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setHistory([]);
      });

    const unsubscribe = subscribe(userId, (data) => {
      setHistory(data.workoutHistory ?? []);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const items = useMemo<RecoveryItem[]>(() => {
    const latestByCategory = new Map<MuscleCategory, number>();

    for (const entry of history) {
      const entryMs = toMs(entry);
      if (entryMs <= 0) continue;
      const exercises = (entry.exercises ?? []) as HistoryExercise[];

      for (const ex of exercises) {
        const legacyCategory = (ex as { category?: unknown }).category;
        const rawCategories = Array.isArray(ex.categories)
          ? ex.categories
          : legacyCategory != null
            ? [legacyCategory]
            : [];
        for (const rawCategory of rawCategories) {
          const expanded = expandToMuscleCategories(rawCategory);
          for (const category of expanded) {
            const previous = latestByCategory.get(category) ?? 0;
            if (entryMs > previous) {
              latestByCategory.set(category, entryMs);
            }
          }
        }
      }
    }

    const resolved: RecoveryItem[] = MUSCLE_ORDER.map((category) => {
      const lastHitMs = latestByCategory.get(category) ?? null;
      const hours = RECOVERY_HOURS[category];
      const hasHistory = lastHitMs != null;
      const remainingMs =
        hasHistory && hours
          ? lastHitMs + hours * 60 * 60 * 1000 - nowMs
          : Number.NEGATIVE_INFINITY;
      return {
        category,
        label: MUSCLE_META[category].label,
        hours: hours ?? 0,
        lastHitMs,
        hasHistory,
        remainingMs,
      };
    });

    return resolved.sort((a, b) => {
      if (a.hasHistory && !b.hasHistory) return -1;
      if (!a.hasHistory && b.hasHistory) return 1;
      if (!a.hasHistory && !b.hasHistory) {
        return MUSCLE_ORDER.indexOf(a.category) - MUSCLE_ORDER.indexOf(b.category);
      }
      return b.remainingMs - a.remainingMs;
    });
  }, [history, nowMs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const recovering = item.remainingMs > 0;
          const meta = MUSCLE_META[item.category];
          return (
            <div
              key={item.category}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-black">
                    <img
                      src={meta.image}
                      alt={meta.label}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{item.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--textMuted)]">
                      Last hit: {formatLastHit(item.lastHitMs)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--textMuted)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{item.hours}h</span>
                </div>
              </div>
              <p
                className={`mt-3 text-lg font-semibold ${
                  item.hasHistory && recovering
                    ? "text-[var(--ice)]"
                    : item.hasHistory
                      ? "text-emerald-400"
                      : "text-[var(--textMuted)]"
                }`}
              >
                {item.hasHistory ? formatDuration(item.remainingMs) : "No data yet"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
