"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getGateUnlocked, WorkoutPasscodeGate } from "./WorkoutPasscodeGate";
import { WorkoutAuth } from "./WorkoutAuth";
import { WorkoutAppTabs } from "./WorkoutAppTabs";

// Show passcode gate first unless explicitly disabled (default: gate before login)
const GATE_ENABLED = process.env.NEXT_PUBLIC_WORKOUT_GATE_ENABLED !== "false";

export default function WorkoutPage() {
  const [mounted, setMounted] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const gateDisabled = process.env.NEXT_PUBLIC_WORKOUT_GATE_ENABLED === "false";
    setGateUnlocked(gateDisabled || getGateUnlocked());
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !gateUnlocked) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [mounted, gateUnlocked]);

  if (!mounted) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ice)]/30" />
        </div>
      </main>
    );
  }

  const showGate = GATE_ENABLED && !gateUnlocked;
  const showAuth = gateUnlocked && authChecked && !user;
  const showApp = gateUnlocked && authChecked && user;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Workout
          </h1>
          <p className="mt-1 text-sm text-[var(--textMuted)]">
            Log workouts and see the community feed.
          </p>
        </motion.header>

        <AnimatePresence mode="wait">
          {showGate && (
            <motion.div
              key="gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WorkoutPasscodeGate onUnlock={() => setGateUnlocked(true)} />
            </motion.div>
          )}
          {showAuth && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WorkoutAuth
                onSignedIn={() => {
                  supabase.auth.getSession().then(({ data: { session } }) => {
                    setUser(session?.user ?? null);
                  });
                }}
              />
            </motion.div>
          )}
          {showApp && user && (
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WorkoutAppTabs
                userId={user.id}
                onSignOut={() => setUser(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
