"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { upsertFOYUserSettings } from "@/lib/supabase/foyDb";
import { FOYOnboardingChoiceCard } from "@/app/focusedonyou/onboarding/_components/FOYOnboardingChoiceCard";
import type { FOYOnboardingStyle } from "@/lib/supabase/foyDb";

const OPTIONS: { value: FOYOnboardingStyle; label: string }[] = [
  { value: "minimal", label: "Minimal logging" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

export default function OnboardingStylePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSelect(value: FOYOnboardingStyle) {
    const supabase = getFOYSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await upsertFOYUserSettings(supabase, user.id, {
        onboarding_style: value,
      });
      router.push("/focusedonyou/onboarding/done");
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
        How do you like to log?
      </motion.h1>
      <motion.p
        className="mt-2 text-[var(--textMuted)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        Quick sets only, or more detail—your call.
      </motion.p>
      {error && <p className="mt-4 text-sm text-[var(--textMuted)]">{error}</p>}
      <ul className="mt-8 flex flex-col gap-3">
        {OPTIONS.map(({ value, label }) => (
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
