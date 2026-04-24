"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";

const GATE_KEY = "admin_gate_ok";
const GATE_TS_KEY = "admin_gate_ts";
const GATE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const ok = localStorage.getItem(GATE_KEY);
  const ts = localStorage.getItem(GATE_TS_KEY);
  if (ok !== "true" || !ts) return false;
  const n = parseInt(ts, 10);
  if (Number.isNaN(n)) return false;
  return Date.now() - n < GATE_EXPIRY_MS;
}

function setUnlocked(password: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GATE_KEY, "true");
  localStorage.setItem(GATE_TS_KEY, String(Date.now()));
  // Shared by every admin page that needs to forward `x-admin-password` to
  // server routes.
  sessionStorage.setItem("admin_password", password);
}

/**
 * Shared admin password gate — matches the behavior of
 * app/websites/admin/AdminPasscodeGate but reusable anywhere.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const gateEnabled = process.env.NEXT_PUBLIC_ADMIN_GATE_ENABLED !== "false";
  const [unlocked, setState] = useState(!gateEnabled);
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (gateEnabled) setState(isUnlocked());
  }, [gateEnabled]);

  if (!mounted) return null;
  if (unlocked) return <>{children}</>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Wrong password.");
        return;
      }
      setUnlocked(password);
      setState(true);
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
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 pt-24"
    >
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-6 sm:p-8">
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
            <Lock className="h-6 w-6" />
          </span>
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-[var(--text)]">
          Admin access
        </h1>
        <p className="mt-1 text-center text-sm text-[var(--textMuted)]">
          Enter your admin password to continue.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
            disabled={loading}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/60"
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-2 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Unlock admin"
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
