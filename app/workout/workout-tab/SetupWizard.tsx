"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  upsertWorkoutSettings,
  type WorkoutSettings,
  type WorkoutModes,
  type WorkoutPreferences,
} from "@/lib/supabase/workout";
import { Button } from "@/components/ui/button";

const TOTAL_STEPS = 3;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TRACKING_OPTIONS = [
  {
    id: "schedule" as const,
    title: "Scheduled days",
    description: "Pick weekdays you plan to workout.",
  },
  {
    id: "sequence" as const,
    title: "No schedule",
    description: "Day 1 / Day 2 rotation for inconsistent weeks.",
  },
];

const defaultModes: WorkoutModes = {
  progressiveOverload: true,
  dropSets: false,
  rpe: false,
  supersets: false,
  amrap: false,
};

const defaultPrefs: WorkoutPreferences = {
  timer_enabled: false,
  timer_default_sec: 90,
  units: "lbs",
  show_suggestions: true,
};

type Step = 1 | 2 | 3;

type WizardState = {
  tracking_style: "schedule" | "sequence";
  selected_days: number[];
  sequence_days_count: number;
  modes: WorkoutModes;
  preferences: WorkoutPreferences;
};

function OptionCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition-colors ${
        selected
          ? "border-[var(--ice)] bg-[var(--iceSoft)]/40 text-[var(--text)]"
          : "border-[var(--border)] bg-[var(--bg2)]/80 text-[var(--textMuted)] hover:border-[var(--ice)]/50 hover:text-[var(--text)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-medium">{title}</span>
        {selected && <CheckCircle2 className="h-5 w-5 text-[var(--ice)]" />}
      </div>
      {description && (
        <p className="mt-1.5 text-sm text-[var(--textMuted)]">{description}</p>
      )}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left ${
        value
          ? "border-[var(--ice)]/60 bg-[var(--iceSoft)]/30"
          : "border-[var(--border)] bg-[var(--bg2)]/80"
      }`}
    >
      <div>
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--textMuted)]">{description}</p>
        )}
      </div>
      <span
        className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          value ? "bg-[var(--ice)]" : "bg-[var(--bg3)]"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export function SetupWizard({
  userId,
  existing,
  onDone,
  onError,
}: {
  userId: string;
  existing: WorkoutSettings | null;
  onDone: (s: WorkoutSettings) => void;
  onError: (msg: string) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(() => ({
    tracking_style: existing?.tracking_style ?? "schedule",
    selected_days: existing?.selected_days ?? [1, 3, 5],
    sequence_days_count: 3,
    modes: existing?.modes ?? defaultModes,
    preferences: existing?.preferences ?? defaultPrefs,
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleDay(idx: number) {
    setState((prev) => {
      const selected = prev.selected_days.includes(idx)
        ? prev.selected_days.filter((d) => d !== idx)
        : [...prev.selected_days, idx].sort();
      return { ...prev, selected_days: selected };
    });
  }

  async function handleFinish() {
    setSaving(true);
    setErr(null);
    onError("");
    try {
      let rotation: { index: number; template_id: string; label: string }[] | null = null;
      if (state.tracking_style === "sequence") {
        const count = Math.max(1, Math.min(7, state.sequence_days_count));
        rotation = Array.from({ length: count }, (_, i) => ({
          index: i,
          template_id: "",
          label: `Day ${i + 1}`,
        }));
      }

      const settings = await upsertWorkoutSettings(userId, {
        tracking_style: state.tracking_style,
        selected_days: state.tracking_style === "schedule" ? state.selected_days : null,
        schedule_map: null,
        rotation,
        modes: state.modes,
        preferences: state.preferences,
        setup_completed: true,
      });
      onDone(settings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save settings.";
      setErr(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text)]">Workout setup</h2>
        <span className="rounded-full bg-[var(--iceSoft)] px-3 py-1.5 text-sm font-medium text-[var(--ice)]">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {step === 1 && (
              <>
                <h3 className="text-lg font-medium text-[var(--text)]">
                  How do you want to track?
                </h3>
                <p className="text-sm text-[var(--textMuted)]">
                  Choose what fits your routine. You can change this later in settings.
                </p>
                <div className="space-y-3">
                  {TRACKING_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      selected={state.tracking_style === opt.id}
                      title={opt.title}
                      description={opt.description}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          tracking_style: opt.id,
                          sequence_days_count:
                            opt.id === "sequence" ? Math.max(2, s.sequence_days_count) : s.sequence_days_count,
                        }))
                      }
                    />
                  ))}
                </div>
                {state.tracking_style === "schedule" && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-[var(--text)]">Workout days</p>
                    <p className="text-xs text-[var(--textMuted)]">
                      Pick which weekdays you plan to workout.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((label, idx) => {
                        const selected = state.selected_days.includes(idx);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-[var(--iceSoft)] text-[var(--ice)]"
                                : "bg-[var(--bg3)] text-[var(--textMuted)] hover:text-[var(--text)]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {state.tracking_style === "sequence" && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-[var(--text)]">How many days per week?</p>
                    <p className="text-xs text-[var(--textMuted)]">
                      You’ll see Day 1, Day 2, Day 3, etc. in your tracker (no calendar days).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[2, 3, 4, 5, 6].map((n) => {
                        const selected = state.sequence_days_count === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setState((s) => ({ ...s, sequence_days_count: n }))
                            }
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-[var(--iceSoft)] text-[var(--ice)]"
                                : "bg-[var(--bg3)] text-[var(--textMuted)] hover:text-[var(--text)]"
                            }`}
                          >
                            {n} days
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-medium text-[var(--text)]">Training options</h3>
                <p className="text-sm text-[var(--textMuted)]">
                  These affect what you see when adding exercises.
                </p>
                <div className="space-y-3">
                  <ToggleRow
                    label="Progressive overload"
                    description="Auto-fill last session's weight so you can bump up."
                    value={state.modes.progressiveOverload}
                    onChange={(v) =>
                      setState((s) => ({ ...s, modes: { ...s.modes, progressiveOverload: v } }))
                    }
                  />
                  <ToggleRow
                    label="Drop sets"
                    description="Add a drop-set button on each exercise to quickly add a lighter set."
                    value={state.modes.dropSets}
                    onChange={(v) =>
                      setState((s) => ({ ...s, modes: { ...s.modes, dropSets: v } }))
                    }
                  />
                  <ToggleRow
                    label="RPE tracking"
                    description="Rate each set 1-10 to track how hard it felt."
                    value={state.modes.rpe}
                    onChange={(v) =>
                      setState((s) => ({ ...s, modes: { ...s.modes, rpe: v } }))
                    }
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-lg font-medium text-[var(--text)]">Preferences</h3>
                <p className="text-sm text-[var(--textMuted)]">
                  Rest timer and units.
                </p>
                <div className="space-y-3">
                  <ToggleRow
                    label="Rest timer"
                    description="Countdown between sets."
                    value={state.preferences.timer_enabled}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        preferences: { ...s.preferences, timer_enabled: v },
                      }))
                    }
                  />
                  {state.preferences.timer_enabled && (
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 px-4 py-3">
                      <span className="text-sm text-[var(--text)]">Default rest (seconds)</span>
                      <input
                        type="number"
                        min={15}
                        max={600}
                        value={state.preferences.timer_default_sec ?? 90}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            preferences: {
                              ...s.preferences,
                              timer_default_sec: Number(e.target.value) || 90,
                            },
                          }))
                        }
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-2 py-1.5 text-right text-sm text-[var(--text)] focus:border-[var(--ice)] focus:outline-none"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 px-4 py-3">
                    <span className="text-sm text-[var(--text)]">Units</span>
                    <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg3)] p-0.5">
                      {(["lbs", "kg"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              preferences: { ...s.preferences, units: u },
                            }))
                          }
                          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                            state.preferences.units === u
                              ? "bg-[var(--iceSoft)] text-[var(--ice)]"
                              : "text-[var(--textMuted)]"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {err && (
                  <p className="text-sm text-red-400" role="alert">
                    {err}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <div className="w-20">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm font-medium text-[var(--textMuted)] hover:text-[var(--text)]"
            >
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {([1, 2, 3] as const).map((n) => (
              <span
                key={n}
                className={`h-1.5 w-6 rounded-full ${
                  n <= step ? "bg-[var(--ice)]" : "bg-[var(--bg3)]"
                }`}
              />
            ))}
          </div>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep((s) => (s + 1) as Step)}>Next</Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
