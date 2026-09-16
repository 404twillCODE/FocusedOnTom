"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { upsertFOYUserSettings } from "@/lib/supabase/foyDb";
import { FOYButton } from "@/app/focusedonyou/_components";

export default function OnboardingDonePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getFOYSupabase();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) {
        router.replace("/focusedonyou/auth");
        return;
      }
      upsertFOYUserSettings(supabase, user.id, { onboarding_completed: true })
        .then(() => {
          setSaving(false);
          router.replace("/focusedonyou/workout");
        })
        .catch((err) => {
          setSaving(false);
          setError(err instanceof Error ? err.message : "Something went wrong.");
        });
    });
  }, [router]);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
      <motion.span
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--iceSoft)] text-[var(--ice)]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Check className="h-8 w-8" aria-hidden />
      </motion.span>
      <motion.h1
        className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        You're all set
      </motion.h1>
      <motion.p
        className="mt-2 text-[var(--textMuted)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        {saving ? "Saving…" : "Taking you to your workout."}
      </motion.p>
      {error && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-[var(--textMuted)]">{error}</p>
          <FOYButton
            variant="primary"
            onClick={() => router.replace("/focusedonyou/workout")}
            className="mt-4 min-h-12 px-8 text-base"
          >
            Go to workout anyway
          </FOYButton>
        </motion.div>
      )}
      {!saving && !error && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FOYButton
            variant="primary"
            onClick={() => router.replace("/focusedonyou/workout")}
            className="min-h-12 px-8 text-base"
          >
            Go to workout
          </FOYButton>
        </motion.div>
      )}
    </div>
  );
}
