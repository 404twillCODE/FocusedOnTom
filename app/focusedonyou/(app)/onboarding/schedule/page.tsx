"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { upsertFOYUserSettings } from "@/lib/supabase/foyDb";
import { FOYOnboardingChoiceCard } from "@/app/focusedonyou/onboarding/_components/FOYOnboardingChoiceCard";

const DAYS = [2, 3, 4, 5];

export default function OnboardingSchedulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSelect(days: number) {
    const supabase = getFOYSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await upsertFOYUserSettings(supabase, user.id, {
        onboarding_schedule_days: days,
      });
      router.push("/focusedonyou/onboarding/equipment");
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
        How many days per week?
      </motion.h1>
      <motion.p
        className="mt-2 text-[var(--textMuted)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        Pick what fits your schedule.
      </motion.p>
      {error && <p className="mt-4 text-sm text-[var(--textMuted)]">{error}</p>}
      <ul className="mt-8 flex flex-col gap-3">
        {DAYS.map((d) => (
          <li key={d}>
            <FOYOnboardingChoiceCard
              label={`${d} days`}
              onSelect={() => handleSelect(d)}
              className={saving ? "pointer-events-none opacity-70" : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
