"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatCents, PHOTO_BRAND } from "@/lib/photography-config";
import { trackEvent } from "@/lib/photography-analytics";
import type { SessionType } from "@/lib/photography-types";

function minDateTimeLocal(): string {
  const now = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function BookingForm({ sessionTypes }: { sessionTypes: SessionType[] }) {
  const [sessionId, setSessionId] = useState(sessionTypes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    kind: "stripe" | "request";
  }>(null);

  const selected = useMemo(
    () => sessionTypes.find((s) => s.id === sessionId),
    [sessionTypes, sessionId]
  );
  const minDate = useMemo(() => minDateTimeLocal(), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !selected) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    trackEvent("book_click", { session_type: sessionId });
    try {
      const res = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_type: sessionId,
          name,
          email,
          starts_at: new Date(startsAt).toISOString(),
          notes,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        ok?: boolean;
        error?: string;
      };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.ok && data.ok) {
        setSuccess({ kind: "request" });
        setNotes("");
        return;
      }
      setError(data.error ?? "Could not submit request.");
    } catch (e) {
      setError((e as Error).message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5 sm:p-8"
    >
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
          Session type
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {sessionTypes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSessionId(s.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                s.id === sessionId
                  ? "border-[var(--ice)]/70 bg-[var(--ice)]/10 text-[var(--ice)]"
                  : "border-[var(--border)] bg-[var(--bg3)]/40 text-[var(--textMuted)] hover:text-[var(--text)]"
              }`}
            >
              <div className="font-medium text-[var(--text)]">{s.label}</div>
              <div className="mt-1 text-xs">
                {s.durationMin}min · deposit {formatCents(s.depositCents)}
              </div>
            </button>
          ))}
        </div>
        {selected && (
          <p className="mt-3 text-xs text-[var(--textMuted)]">
            {selected.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
            Name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
            Email
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
          Preferred day &amp; time
        </span>
        <input
          required
          type="datetime-local"
          min={minDate}
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
        />
        <span className="mt-1 block text-[11px] text-[var(--textMuted)]">
          We&apos;ll confirm or propose an alternative before charging the deposit.
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
          Notes
        </span>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Location ideas, mood, number of people, car details, etc."
          className="mt-1 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-3 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : selected ? (
          `Request · deposit ${formatCents(selected.depositCents)}`
        ) : (
          "Send request"
        )}
      </button>

      {success?.kind === "request" && (
        <div className="rounded-lg border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-3 text-sm text-[var(--ice)]">
          Got it — I&apos;ll reply to {email || "your email"} shortly with next
          steps. No charge yet. Questions?{" "}
          <a
            href={`mailto:${PHOTO_BRAND.contactEmail}`}
            className="underline"
          >
            {PHOTO_BRAND.contactEmail}
          </a>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
    </form>
  );
}
