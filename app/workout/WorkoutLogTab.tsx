"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, CheckCircle2, Clock, Flame } from "lucide-react";
import {
  getActiveSession,
  getLastCompletedSession,
  getWorkoutSettings,
  startWorkoutSession,
  finishWorkoutSession,
  upsertWorkoutSettings,
  type WorkoutModes,
  type WorkoutPreferences,
  type WorkoutSession,
  type WorkoutSettings,
} from "@/lib/supabase/workout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SetupState =
  | { status: "loading" }
  | { status: "needs-setup"; settings: WorkoutSettings | null }
  | { status: "ready"; settings: WorkoutSettings };

type LocalSet = {
  id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  is_done: boolean;
  is_drop_set: boolean;
  drop_set_level: number | null;
  rpe: number | null;
};

type LocalExercise = {
  id: string;
  name: string;
  sets: LocalSet[];
};

const DEFAULT_MODES: WorkoutModes = {
  progressiveOverload: true,
  dropSets: false,
  rpe: false,
  supersets: false,
  amrap: false,
};

const DEFAULT_PREFS: WorkoutPreferences = {
  timer_enabled: false,
  timer_default_sec: 90,
  units: "lbs",
  show_suggestions: true,
};

export function WorkoutLogTab({ userId }: { userId: string }) {
  const [setup, setSetup] = useState<SetupState>({ status: "loading" });
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [localExercises, setLocalExercises] = useState<LocalExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [settings, existingSession] = await Promise.all([
          getWorkoutSettings(userId),
          getActiveSession(userId),
        ]);
        if (cancelled) return;
        if (!settings || !settings.setup_completed) {
          setSetup({ status: "needs-setup", settings });
        } else {
          setSetup({ status: "ready", settings });
        }
        setActiveSession(existingSession);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load workout settings.");
          setSetup({ status: "needs-setup", settings: null });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const modes: WorkoutModes =
    setup.status === "ready"
      ? setup.settings.modes
      : setup.status === "needs-setup" && setup.settings
      ? setup.settings.modes
      : DEFAULT_MODES;

  const prefs: WorkoutPreferences =
    setup.status === "ready"
      ? setup.settings.preferences
      : setup.status === "needs-setup" && setup.settings
      ? setup.settings.preferences
      : DEFAULT_PREFS;

  if (setup.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading your workout home…</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      {setup.status === "needs-setup" && (
        <SetupWizard
          userId={userId}
          existing={setup.settings}
          onCompleted={(settings) => {
            setSetup({ status: "ready", settings });
          }}
        />
      )}
      {setup.status === "ready" && !activeSession && (
        <WorkoutHome
          userId={userId}
          settings={setup.settings}
          modes={modes}
          prefs={prefs}
          onStartSession={async (session, exercises) => {
            setActiveSession(session);
            setLocalExercises(exercises);
          }}
          onError={(msg) => setError(msg)}
        />
      )}
      {setup.status === "ready" && activeSession && (
        <ActiveSessionView
          session={activeSession}
          exercises={localExercises}
          modes={modes}
          prefs={prefs}
          saving={saving}
          onChangeExercises={setLocalExercises}
          onFinish={async (notes, durationMin) => {
            setSaving(true);
            setError(null);
            try {
              await finishWorkoutSession({
                sessionId: activeSession.id,
                notes,
                durationMin,
                exercises: localExercises.map((e) => ({
                  name: e.name,
                  sets: e.sets.map((s) => ({
                    set_number: s.set_number,
                    reps: s.reps,
                    weight: s.weight,
                    is_done: s.is_done,
                    is_drop_set: s.is_drop_set,
                    drop_set_level: s.drop_set_level,
                    rpe: s.rpe,
                  })),
                })),
                modes,
              });
              setActiveSession(null);
              setLocalExercises([]);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to finish workout.");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ---------- Setup wizard ----------

type TrackingStyle = WorkoutSettings["tracking_style"];

type WizardStep = 1 | 2 | 3 | 4 | 5;

type WizardState = {
  tracking_style: TrackingStyle;
  selected_days: number[];
  modes: WorkoutModes;
  preferences: WorkoutPreferences;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TEMPLATE_CHOICES = [
  { id: "ppl", label: "PPL (Push / Pull / Legs)" },
  { id: "upper-lower", label: "Upper / Lower" },
  { id: "full-body", label: "Full body" },
  { id: "custom", label: "Custom" },
] as const;

type TemplateChoiceId = (typeof TEMPLATE_CHOICES)[number]["id"];

function makeDefaultWizardState(existing?: WorkoutSettings | null): WizardState {
  const modes = existing?.modes ?? DEFAULT_MODES;
  const prefs = existing?.preferences ?? DEFAULT_PREFS;
  return {
    tracking_style: existing?.tracking_style ?? "schedule",
    selected_days: existing?.selected_days ?? [1, 3, 5],
    modes,
    preferences: prefs,
  };
}

function SetupWizard({
  userId,
  existing,
  onCompleted,
}: {
  userId: string;
  existing: WorkoutSettings | null;
  onCompleted: (settings: WorkoutSettings) => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [state, setState] = useState<WizardState>(() => makeDefaultWizardState(existing));
  const [templateChoice, setTemplateChoice] = useState<TemplateChoiceId>("ppl");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const settings = await upsertWorkoutSettings(userId, {
        tracking_style: state.tracking_style,
        selected_days: state.tracking_style === "schedule" ? state.selected_days : null,
        modes: state.modes,
        preferences: state.preferences,
        setup_completed: true,
      });
      onCompleted(settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Log</h2>
          <p className="text-xs text-[var(--textMuted)]">
            One-time setup to match how you actually train.
          </p>
        </div>
        <span className="rounded-full bg-[var(--iceSoft)] px-3 py-1 text-xs font-medium text-[var(--ice)]">
          Step {step}/5
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              How do you prefer to track?
            </h3>
            <p className="text-xs text-[var(--textMuted)]">
              You can change this later in workout settings.
            </p>
            <div className="space-y-2">
              <OptionCard
                selected={state.tracking_style === "schedule"}
                title="Schedule by days"
                description="Pick workout weekdays and we'll plan around your week."
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    tracking_style: "schedule",
                  }))
                }
              />
              <OptionCard
                selected={state.tracking_style === "sequence"}
                title="No fixed schedule"
                description="Day 1 / Day 2 / Day 3 rotation. Perfect if your weeks are unpredictable."
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    tracking_style: "sequence",
                  }))
                }
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Training split</h3>
            <p className="text-xs text-[var(--textMuted)]">
              Start from a template or go fully custom.
            </p>
            <div className="space-y-2">
              {TEMPLATE_CHOICES.map((t) => (
                <OptionCard
                  key={t.id}
                  selected={templateChoice === t.id}
                  title={t.label}
                  onClick={() => setTemplateChoice(t.id)}
                />
              ))}
            </div>
            {state.tracking_style === "schedule" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text)]">Workout days</p>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((label, idx) => {
                    const selected = state.selected_days.includes(idx);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`h-8 rounded-full px-3 text-xs font-medium ${
                          selected
                            ? "bg-[var(--iceSoft)] text-[var(--ice)]"
                            : "bg-[var(--bg3)] text-[var(--textMuted)] hover:bg-[var(--bg3)]/80"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[var(--textMuted)]">
                  We'll attach templates to these days (e.g. Mon = Push, Wed = Legs).
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Training modes</h3>
            <p className="text-xs text-[var(--textMuted)]">
              Keep it minimal. You can toggle off anything you don't care about.
            </p>
            <div className="space-y-2">
              <ToggleRow
                label="Progressive overload"
                description="Suggest the next weight/reps based on your history."
                value={state.modes.progressiveOverload}
                onChange={(v) =>
                  setState((s) => ({ ...s, modes: { ...s.modes, progressiveOverload: v } }))
                }
              />
              <ToggleRow
                label="Drop sets"
                description="Quickly add descending-weight sets for a movement."
                value={state.modes.dropSets}
                onChange={(v) =>
                  setState((s) => ({ ...s, modes: { ...s.modes, dropSets: v } }))
                }
              />
              <ToggleRow
                label="RPE"
                description="Optional RPE field per set."
                value={state.modes.rpe}
                onChange={(v) =>
                  setState((s) => ({ ...s, modes: { ...s.modes, rpe: v } }))
                }
              />
              <ToggleRow
                label="Supersets"
                description="Mark back-to-back exercises as paired."
                value={state.modes.supersets}
                onChange={(v) =>
                  setState((s) => ({ ...s, modes: { ...s.modes, supersets: v } }))
                }
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Preferences</h3>
            <p className="text-xs text-[var(--textMuted)]">
              Dial in units, timers and suggestions.
            </p>
            <ToggleRow
              label="Rest timer"
              description="Show a simple between-set timer."
              value={state.preferences.timer_enabled}
              onChange={(v) =>
                setState((s) => ({
                  ...s,
                  preferences: { ...s.preferences, timer_enabled: v },
                }))
              }
            />
            {state.preferences.timer_enabled && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--textMuted)]">Default rest (sec)</span>
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
                  className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-2 py-1 text-right text-xs text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                />
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--textMuted)]">Units</span>
              <div className="inline-flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg3)]">
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
                    className={`px-3 py-1.5 text-[10px] font-medium ${
                      state.preferences.units === u
                        ? "bg-[var(--iceSoft)] text-[var(--ice)]"
                        : "text-[var(--textMuted)]"
                    }`}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow
              label="Show suggested next workout"
              description="Highlight what's up next based on your plan."
              value={state.preferences.show_suggestions}
              onChange={(v) =>
                setState((s) => ({
                  ...s,
                  preferences: { ...s.preferences, show_suggestions: v },
                }))
              }
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">You're set</h3>
            <p className="text-xs text-[var(--textMuted)]">
              We'll use these settings to drive your daily suggestions and logging flow.
            </p>
            <div className="rounded-xl bg-[var(--bg3)]/80 p-3 text-xs text-[var(--textMuted)]">
              <p className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[var(--ice)]" />
                <span>Next time you land here, you'll go straight into your workout home.</span>
              </p>
            </div>
            {error && (
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--textMuted)]">
        <span>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => ((s - 1) as WizardStep))}
              className="text-[var(--textMuted)] hover:text-[var(--text)]"
            >
              Back
            </button>
          )}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-5 rounded-full ${
                  n <= step ? "bg-[var(--ice)]" : "bg-[var(--bg3)]"
                }`}
              />
            ))}
          </div>
          {step < 5 ? (
            <Button
              size="sm"
              className="ml-1"
              onClick={() => setStep((s) => ((s + 1) as WizardStep))}
            >
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinish} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

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
      className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${
        selected
          ? "border-[var(--ice)]/70 bg-[var(--iceSoft)]/40 text-[var(--text)]"
          : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:border-[var(--ice)]/40 hover:text-[var(--text)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{title}</span>
        {selected && <CheckCircle2 className="h-4 w-4 text-[var(--ice)]" />}
      </div>
      {description && (
        <p className="mt-1 text-xs text-[var(--textMuted)]">{description}</p>
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
      className={`flex w-full items-start justify-between rounded-xl border px-3 py-2 text-left text-xs ${
        value
          ? "border-[var(--ice)]/60 bg-[var(--iceSoft)]/30 text-[var(--text)]"
          : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:border-[var(--ice)]/40 hover:text-[var(--text)]"
      }`}
    >
      <span className="mr-3">
        <span className="block text-[11px] font-medium text-[var(--text)]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[10px] text-[var(--textMuted)]">
            {description}
          </span>
        )}
      </span>
      <span
        className={`mt-0.5 inline-flex h-4 w-7 items-center rounded-full ${
          value ? "bg-[var(--ice)]/80" : "bg-[var(--bg3)]"
        }`}
      >
        <span
          className={`ml-[2px] h-3 w-3 rounded-full bg-white transition-transform ${
            value ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

// ---------- Workout home ----------

type WorkoutHomeProps = {
  userId: string;
  settings: WorkoutSettings;
  modes: WorkoutModes;
  prefs: WorkoutPreferences;
  onStartSession: (session: WorkoutSession, exercises: LocalExercise[]) => void;
  onError: (msg: string) => void;
};

function WorkoutHome({ userId, settings, onStartSession, onError }: WorkoutHomeProps) {
  const [loading, setLoading] = useState(false);

  const todayInfo = useMemo(() => {
    const today = new Date();
    const weekday = today.getDay(); // 0-6
    const dayLabel = WEEKDAYS[weekday];
    return { weekday, dayLabel };
  }, []);

  async function handleStart(plannedLabel: string) {
    setLoading(true);
    try {
      const { session } = await startWorkoutSession({
        userId,
        dayLabel: plannedLabel,
        templateId: null,
      });
      onStartSession(session, makeDefaultExercisesForSession(plannedLabel));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to start session.");
    } finally {
      setLoading(false);
    }
  }

  const isSchedule = settings.tracking_style === "schedule";
  const isWorkoutDay =
    isSchedule && Array.isArray(settings.selected_days)
      ? settings.selected_days.includes(todayInfo.weekday)
      : false;

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--textMuted)]">
            Today's plan
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">
            {isSchedule ? (isWorkoutDay ? "Training day" : "Rest day") : "Next session"}
          </h2>
        </div>
        <span className="rounded-full bg-[var(--bg3)] px-3 py-1 text-[10px] text-[var(--textMuted)]">
          {todayInfo.dayLabel}
        </span>
      </div>

      {isSchedule ? (
        isWorkoutDay ? (
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4">
            <p className="text-sm text-[var(--text)]">
              You planned to train today. Tap below to start logging.
            </p>
            <Button
              className="w-full"
              onClick={() => handleStart(`${todayInfo.dayLabel} session`)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Start workout
                </>
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-[var(--textMuted)] hover:text-[var(--text)]"
              onClick={() => handleStart("Unplanned session")}
            >
              Log workout anyway
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4">
            <p className="text-sm text-[var(--text)]">Rest day on your schedule.</p>
            <p className="text-xs text-[var(--textMuted)]">
              If you still want to train, you can log an ad‑hoc session.
            </p>
            <Button
              variant="outline"
              className="w-full border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--ice)]/60"
              onClick={() => handleStart("Unplanned session")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Log workout anyway
                </>
              )}
            </Button>
          </div>
        )
      ) : (
        <SequencePlan userId={userId} onStart={handleStart} />
      )}
    </motion.div>
  );
}

function makeDefaultExercisesForSession(label: string): LocalExercise[] {
  const baseName = label.includes("session") ? label.replace(" session", "") : label;
  return [
    {
      id: `ex-${baseName.toLowerCase()}`,
      name: baseName,
      sets: [],
    },
  ];
}

function SequencePlan({
  userId,
  onStart,
}: {
  userId: string;
  onStart: (label: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextLabel, setNextLabel] = useState<string>("Day 1");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const last = await getLastCompletedSession(userId);
        if (cancelled) return;
        if (!last?.day_label) {
          setNextLabel("Day 1");
        } else if (last.day_label.startsWith("Day ")) {
          const num = parseInt(last.day_label.slice(4), 10);
          setNextLabel(`Day ${Number.isFinite(num) ? num + 1 : 1}`);
        } else {
          setNextLabel("Day 1");
        }
      } catch (e) {
        if (!cancelled) setError("Failed to determine next day.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--textMuted)]">
        Sequence mode
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--textMuted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Looking up your last session…</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--text)]">Next up: {nextLabel}</p>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          <Button className="mt-1 w-full" onClick={() => onStart(nextLabel)} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Start workout
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}

// ---------- Active session ----------

type ActiveSessionViewProps = {
  session: WorkoutSession;
  exercises: LocalExercise[];
  modes: WorkoutModes;
  prefs: WorkoutPreferences;
  saving: boolean;
  onChangeExercises: (ex: LocalExercise[]) => void;
  onFinish: (notes: string, durationMin: number | null) => Promise<void>;
};

function ActiveSessionView({
  session,
  exercises,
  modes,
  prefs,
  saving,
  onChangeExercises,
  onFinish,
}: ActiveSessionViewProps) {
  const [notes, setNotes] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!prefs.timer_enabled || restRemaining == null) return;
    if (restRemaining <= 0) {
      setRestRemaining(null);
      return;
    }
    const id = window.setTimeout(() => {
      setRestRemaining((r) => (r == null ? null : r - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [restRemaining, prefs.timer_enabled]);

  function addSet(exId: string, isDropSet = false) {
    onChangeExercises(
      exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const nextNumber = ex.sets.length + 1;
        const last = ex.sets[ex.sets.length - 1];
        const baseWeight = last?.weight ?? null;
        const weight =
          isDropSet && baseWeight != null ? Math.round(baseWeight * 0.85 * 2) / 2 : baseWeight;
        const dropLevel =
          isDropSet && last?.is_drop_set
            ? (last.drop_set_level ?? 0) + 1
            : isDropSet
            ? 1
            : null;
        const newSet: LocalSet = {
          id: `${ex.id}-set-${nextNumber}-${Date.now()}`,
          set_number: nextNumber,
          reps: last?.reps ?? null,
          weight,
          is_done: false,
          is_drop_set: isDropSet,
          drop_set_level: dropLevel,
          rpe: last?.rpe ?? null,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  }

  function updateSet(
    exId: string,
    setId: string,
    patch: Partial<Pick<LocalSet, "reps" | "weight" | "is_done" | "rpe">>
  ) {
    onChangeExercises(
      exercises.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
            }
          : ex
      )
    );
  }

  const headerLabel = session.day_label ?? "Active session";

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--textMuted)]">
            Active session
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">{headerLabel}</h2>
        </div>
        {prefs.timer_enabled && (
          <button
            type="button"
            onClick={() =>
              setRestRemaining(
                restRemaining == null ? prefs.timer_default_sec ?? 90 : prefs.timer_default_sec
              )
            }
            className="flex items-center gap-1 rounded-full bg-[var(--bg3)] px-3 py-1 text-[10px] text-[var(--text)] hover:bg-[var(--bg3)]/80"
          >
            <Clock className="h-3 w-3" />
            <span>{restRemaining != null ? `${restRemaining}s` : "Start rest"}</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text)]">{ex.name}</p>
            </div>
            <div className="space-y-2">
              {ex.sets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center gap-2 rounded-xl bg-[var(--bg3)]/60 px-3 py-2 text-xs"
                >
                  <span className="w-8 text-[var(--textMuted)]">{set.set_number}</span>
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps ?? ""}
                    onChange={(e) =>
                      updateSet(ex.id, set.id, {
                        reps: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="h-8 w-16 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-[10px] text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Weight"
                    value={set.weight ?? ""}
                    onChange={(e) =>
                      updateSet(ex.id, set.id, {
                        weight: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="h-8 w-20 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-[10px] text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                  />
                  {modes.rpe && (
                    <input
                      type="number"
                      step={0.5}
                      placeholder="RPE"
                      value={set.rpe ?? ""}
                      onChange={(e) =>
                        updateSet(ex.id, set.id, {
                          rpe: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 w-16 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-2 text-[10px] text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      updateSet(ex.id, set.id, {
                        is_done: !set.is_done,
                      })
                    }
                    className={`ml-auto h-6 w-6 rounded-full border text-[10px] ${
                      set.is_done
                        ? "border-[var(--ice)] bg-[var(--iceSoft)] text-[var(--ice)]"
                        : "border-[var(--border)] text-[var(--textMuted)]"
                    }`}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--ice)]/60"
                onClick={() => addSet(ex.id, false)}
              >
                + Set
              </Button>
              {modes.dropSets && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--ice)]/60"
                  onClick={() => addSet(ex.id, true)}
                >
                  + Drop set
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <textarea
          rows={3}
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--textMuted)] focus:border-[var(--ice)]/50 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs text-[var(--textMuted)]">
          <span>Duration (min)</span>
          <input
            type="number"
            min={0}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-2 py-1 text-right text-[10px] text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
          />
        </div>
      </div>

      <Button
        className="mt-2 w-full"
        onClick={() => onFinish(notes, durationMin ? Number(durationMin) : null)}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Finish workout
          </>
        )}
      </Button>
    </motion.div>
  );
}

