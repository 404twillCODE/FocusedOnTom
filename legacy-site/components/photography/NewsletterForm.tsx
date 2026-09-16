"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { trackEvent } from "@/lib/photography-analytics";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; verifying: boolean }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        verifying?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus({ kind: "error", message: data.error ?? "Failed" });
        return;
      }
      trackEvent("newsletter_subscribe", {});
      setStatus({ kind: "ok", verifying: Boolean(data.verifying) });
      setEmail("");
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "" : "mt-4"}>
      <div
        className={`flex flex-wrap items-center gap-2 ${
          compact ? "" : "rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-3 sm:p-4"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5">
          <Mail className="h-3.5 w-3.5 text-[var(--textMuted)]" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--textMuted)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-4 py-1.5 text-xs font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
      {status.kind === "ok" && (
        <p className="mt-2 text-xs text-[var(--ice)]">
          {status.verifying
            ? "Check your inbox to confirm."
            : "You're on the list."}
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-2 text-xs text-rose-300">{status.message}</p>
      )}
    </form>
  );
}
