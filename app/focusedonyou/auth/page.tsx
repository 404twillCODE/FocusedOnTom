"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import {
  FOYContainer,
  FOYCard,
  FOYInput,
  FOYButton,
  FOYBackLink,
  FOYBackground,
} from "@/app/focusedonyou/_components";

type Mode = "signin" | "signup";

export default function FocusedOnYouAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    const supabase = getFOYSupabase();
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
        if (signInError) throw signInError;
        router.replace("/focusedonyou");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="focusedonyou-no-zoom min-h-screen">
      <FOYBackground />
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur-xl">
        <FOYBackLink href="/focusedonyou" ariaLabel="Back to FocusedOnYou home">
          Back
        </FOYBackLink>
      </div>

      <FOYContainer className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <FOYCard className="flex flex-col">
            <div className="flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
                {mode === "signin" ? (
                  <LogIn className="h-6 w-6" aria-hidden />
                ) : (
                  <UserPlus className="h-6 w-6" aria-hidden />
                )}
              </span>
            </div>
            <h1 className="mt-4 text-center text-xl font-semibold text-[var(--text)]">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-1 text-center text-sm text-[var(--textMuted)]">
              {mode === "signin"
                ? "Sign in to save your data and sync across devices."
                : "Create an account to get started."}
            </p>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <FOYInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
              <FOYInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-[var(--ice)]" role="status">
                  {message}
                </p>
              )}
              <FOYButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {mode === "signin" ? "Signing in…" : "Signing up…"}
                  </span>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Sign up"
                )}
              </FOYButton>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--textMuted)]">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-[var(--ice)] hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-[var(--ice)] hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </FOYCard>
        </motion.div>
      </FOYContainer>
    </div>
  );
}
