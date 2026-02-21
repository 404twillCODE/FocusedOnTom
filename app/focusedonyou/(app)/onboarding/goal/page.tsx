"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { upsertFOYUserSettings } from "@/lib/supabase/foyDb";
import { FOYOnboardingChoiceCard } from "@/app/focusedonyou/onboarding/_components/FOYOnboardingChoiceCard";
import type { FOYOnboardingGoal } from "@/lib/supabase/foyDb";

const GOALS: { value: FOYOnboardingGoal; label: string }[] = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "balanced", label: "Balanced" },
];

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSelect(value: FOYOnboardingGoal) {
    const supabase = getFOYSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await upsertFOYUserSettings(supabase, user.id, { onboarding_goal: value });
      router.push("/focusedonyou/onboarding/schedule");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.h1
        className="text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        What's your goal?
      </motion.h1>
      <motion.p
        className="mt-2 text-[var(--textMuted)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        We'll use this to suggest workouts.
      </motion.p>
      {error && <p className="mt-4 text-sm text-[var(--textMuted)]">{error}</p>}
      <ul className="mt-8 flex flex-col gap-3">
        {GOALS.map(({ value, label }) => (
          <li key={value}>
            <FOYOnboardingChoiceCard
              label={label}
              onSelect={() => handleSelect(value)}
              className={saving ? "pointer-events-none opacity-70" : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
