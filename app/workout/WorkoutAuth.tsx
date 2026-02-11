"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export function WorkoutAuth({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup") {
      if (!trimmedUsername) {
        setError("Username is required.");
        return;
      }
      if (trimmedUsername.length < 2) {
        setError("Username must be at least 2 characters.");
        return;
      }
      if (!USERNAME_REGEX.test(trimmedUsername)) {
        setError(
          "Username can only contain letters, numbers, underscore and hyphen.",
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              // Store desired username in user metadata; profile row is created later.
              username: trimmedUsername,
            },
          },
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
        onSignedIn();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4"
    >
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-6 sm:p-8">
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
            {mode === "signin" ? (
              <LogIn className="h-6 w-6" />
            ) : (
              <UserPlus className="h-6 w-6" />
            )}
          </span>
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-[var(--text)]">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-center text-sm text-[var(--textMuted)]">
          {mode === "signin"
            ? "Sign in to log workouts and see the community feed."
            : "Create an account to join the workout group."}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              autoComplete="username"
              disabled={loading}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            autoComplete="email"
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in…" : "Signing up…"}
              </span>
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Sign up"
            )}
          </Button>
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
      </div>
    </motion.div>
  );
}
