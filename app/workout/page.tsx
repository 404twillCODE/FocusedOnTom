"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getGateUnlocked, WorkoutPasscodeGate } from "./WorkoutPasscodeGate";
import { WorkoutAuth } from "./WorkoutAuth";
import { WorkoutAppTabs } from "./WorkoutAppTabs";
import { WorkoutInstallPrompt } from "./WorkoutInstallPrompt";
import { ToastProvider } from "./AppToast";

// Show passcode gate first unless explicitly disabled (default: gate before login)
const GATE_ENABLED = process.env.NEXT_PUBLIC_WORKOUT_GATE_ENABLED !== "false";
const INSTALL_DISMISSED_KEY = "workout_install_dismissed";

export default function WorkoutPage() {
  const [mounted, setMounted] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<"ios" | "android" | "other">(
    "other",
  );

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

  // After login, prompt mobile users (not already in standalone/app mode) to add to home screen.
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === "true";

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari standalone
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    const ua = window.navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const isMobile = isIOS || isAndroid;

    if (!dismissed && isMobile && !isStandalone) {
      setInstallPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");
      setShowInstallPrompt(true);
    }
  }, [user]);

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
    <ToastProvider>
      <main className="min-h-screen -mt-16 sm:-mt-20">
        <div className="mx-auto max-w-2xl px-4 pt-2 pb-8">
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

        {showApp && (
          <WorkoutInstallPrompt
            open={showInstallPrompt}
            platform={installPlatform}
            onDismiss={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
              }
              setShowInstallPrompt(false);
            }}
          />
        )}
      </main>
    </ToastProvider>
  );
}
