"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GATE_KEY = "workout_gate_ok";
const GATE_TS_KEY = "workout_gate_ts";
const GATE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getGateUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const ok = localStorage.getItem(GATE_KEY);
  const ts = localStorage.getItem(GATE_TS_KEY);
  if (ok !== "true" || !ts) return false;
  const n = parseInt(ts, 10);
  if (Number.isNaN(n)) return false;
  return Date.now() - n < GATE_EXPIRY_MS;
}

export function setGateUnlocked(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GATE_KEY, "true");
  localStorage.setItem(GATE_TS_KEY, String(Date.now()));
}

export function WorkoutPasscodeGate({
  onUnlock,
}: {
  onUnlock: () => void;
}) {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!passcode.trim()) {
      setError("Enter the passcode.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/workout/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passcode.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setGateUnlocked();
        onUnlock();
      } else {
        setError(data.error ?? "Wrong passcode.");
      }
    } catch {
      setError("Something went wrong.");
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
            <Lock className="h-6 w-6" />
          </span>
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-[var(--text)]">
          Members only
        </h1>
        <p className="mt-1 text-center text-sm text-[var(--textMuted)]">
          Enter the passcode to continue.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3" aria-label="Passcode">
          <Input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full"
            autoComplete="current-password"
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </span>
            ) : (
              "Unlock"
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
