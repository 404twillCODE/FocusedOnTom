"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getWorkoutSettings, type WorkoutSettings } from "@/lib/supabase/workout";
import { GetFitWorkoutTracker } from "./GetFitWorkoutTracker";
import { SetupWizard } from "./SetupWizard";

export function WorkoutTab({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<WorkoutSettings | null | undefined>(
    undefined
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    getWorkoutSettings(userId)
      .then((s) => {
        if (!cancelled) setSettings(s ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load settings");
          setSettings(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Loading
  if (settings === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center pb-28">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
      </div>
    );
  }

  // No settings or setup not completed → show setup wizard (restart setup / first-time)
  if (!settings || !settings.setup_completed) {
    return (
      <div className="pb-28">
        <SetupWizard
          userId={userId}
          existing={settings ?? null}
          onDone={(s) => setSettings(s)}
          onError={setError}
        />
        {error ? (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        ) : null}
      </div>
    );
  }

  // Setup completed → show main workout tracker
  return (
    <div className="pb-28">
      <GetFitWorkoutTracker userId={userId} settings={settings} />
    </div>
  );
}
