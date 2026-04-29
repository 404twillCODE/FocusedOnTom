"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Car, ChevronLeft, HelpCircle, Loader2 } from "lucide-react";
import {
  AUTOMOTIVE_BASE_SESSION_CENTS,
  BOOKING_POLICY,
  CAR_DELIVERABLES,
  estimateAutomotiveSessionCents,
  formatCents,
  PHOTO_BRAND,
} from "@/lib/photography-config";
import { trackEvent } from "@/lib/photography-analytics";
import type { SessionType } from "@/lib/photography-types";

function minDateTimeLocal(): string {
  const now = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

type WizardStep = "path" | "deliverables" | "summary" | "contact";

function progressLabel(sessionId: string, step: WizardStep): string {
  if (step === "path") return "Booking type";
  if (step === "deliverables") return "What you want";
  if (step === "summary") return "Summary";
  return "Contact & deposit";
}

function progressStep(sessionId: string, step: WizardStep): { n: number; total: number } {
  const isCar = sessionId === "automotive";
  const total = isCar ? 4 : 3;
  if (step === "path") return { n: 1, total: 4 };
  if (step === "deliverables") return { n: 2, total: 4 };
  if (step === "summary") return { n: isCar ? 3 : 2, total };
  return { n: isCar ? 4 : 3, total };
}

function errorMessage(code: string | undefined): string {
  switch (code) {
    case "missing_deliverables":
      return "Pick at least one deliverable for a car session.";
    case "missing_contact":
      return "Please enter a valid name and email.";
    case "invalid_date":
      return "Choose a valid preferred date and time.";
    case "invalid_session_type":
      return "That session type is not available.";
    default:
      return code ?? "Could not submit request.";
  }
}

export function BookingForm({ sessionTypes }: { sessionTypes: SessionType[] }) {
  const searchParams = useSearchParams();
  const [showCanceledBanner, setShowCanceledBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("canceled") === "1") setShowCanceledBanner(true);
  }, [searchParams]);

  const automotive = useMemo(
    () => sessionTypes.find((s) => s.id === "automotive"),
    [sessionTypes]
  );
  const specialRequest = useMemo(
    () => sessionTypes.find((s) => s.id === "special_request"),
    [sessionTypes]
  );

  const [step, setStep] = useState<WizardStep>("path");
  const [sessionId, setSessionId] = useState("");
  const [deliverableIds, setDeliverableIds] = useState<string[]>([]);
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

  const automotiveGuideTotal = useMemo(() => {
    if (sessionId !== "automotive" || deliverableIds.length === 0) return null;
    return estimateAutomotiveSessionCents(deliverableIds);
  }, [sessionId, deliverableIds]);

  const { n: stepN, total: stepTotal } = progressStep(sessionId, step);

  function toggleDeliverable(id: string) {
    setDeliverableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function choosePath(id: string) {
    setSessionId(id);
    setError(null);
    if (id === "automotive") setStep("deliverables");
    else setStep("summary");
  }

  function goBack() {
    setError(null);
    if (step === "deliverables") {
      setStep("path");
      setSessionId("");
      setDeliverableIds([]);
    } else if (step === "summary") {
      if (sessionId === "automotive") setStep("deliverables");
      else {
        setStep("path");
        setSessionId("");
      }
    } else if (step === "contact") setStep("summary");
  }

  function continueFromDeliverables() {
    if (deliverableIds.length === 0) {
      setError("Select at least one: static photos, rollers, or short-form.");
      return;
    }
    setError(null);
    setStep("summary");
  }

  function continueFromSummary() {
    if (!startsAt) {
      setError("Choose a preferred date and time.");
      return;
    }
    const d = new Date(startsAt);
    if (isNaN(d.getTime())) {
      setError("That date and time is not valid.");
      return;
    }
    setError(null);
    setStep("contact");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !selected) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    trackEvent("book_click", {
      session_type: sessionId,
      deliverables: deliverableIds.join(","),
    });
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
          deliverables: sessionId === "automotive" ? deliverableIds : undefined,
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
      setError(errorMessage(data.error));
    } catch (e) {
      setError((e as Error).message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  const shellClass =
    "mt-8 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5 sm:p-8";

  if (!automotive || !specialRequest) {
    return (
      <div className={shellClass}>
        <p className="text-sm text-[var(--textMuted)]">
          Booking is not configured. Add automotive and special_request session
          types in photography config.
        </p>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {showCanceledBanner && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100/90">
          <p>
            Checkout was canceled — no charge. Adjust anything below and try
            again when you are ready.
          </p>
          <button
            type="button"
            onClick={() => setShowCanceledBanner(false)}
            className="shrink-0 text-xs uppercase tracking-wider text-amber-200/80 hover:text-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/25 px-4 py-3 text-[11px] leading-relaxed text-[var(--textMuted)] sm:text-xs">
        <p>
          {BOOKING_POLICY.depositRefundIfDeclined}{" "}
          {BOOKING_POLICY.preferredDateFlexible}
        </p>
        <p className="mt-2">
          {sessionId === "automotive"
            ? BOOKING_POLICY.basePricingFlex
            : sessionId === "special_request"
              ? "Special requests: final quote after we scope it — agreed before you owe more than the deposit."
              : `${BOOKING_POLICY.basePricingFlex} Other shoots: quoted after we scope.`}
        </p>
      </div>

      {step !== "path" && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--textMuted)] hover:text-[var(--ice)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Back
          </button>
          <span className="text-xs text-[var(--textMuted)]">
            Step {stepN} of {stepTotal} · {progressLabel(sessionId, step)}
          </span>
        </div>
      )}

      {step === "path" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--text)]">
              What are we booking?
            </h2>
            <p className="mt-1 text-sm text-[var(--textMuted)]">
              Most sessions are car-focused. Choose &quot;Something else&quot;
              only if you need a non-automotive shoot.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => choosePath("automotive")}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/40 px-4 py-4 text-left transition-colors hover:border-[var(--ice)]/40 hover:bg-[var(--ice)]/5"
            >
              <Car className="h-5 w-5 text-[var(--ice)]" aria-hidden />
              <div className="mt-2 font-medium text-[var(--text)]">
                {automotive.label}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--textMuted)]">
                Statics, rollers, TikTok-style — pick any combination on the next
                screen.
              </p>
              <div className="mt-2 text-xs text-[var(--ice)]">
                Deposit {formatCents(automotive.depositCents)} · ~
                {automotive.durationMin} min
              </div>
            </button>
            <button
              type="button"
              onClick={() => choosePath("special_request")}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/40 px-4 py-4 text-left transition-colors hover:border-[var(--ice)]/40 hover:bg-[var(--ice)]/5"
            >
              <HelpCircle className="h-5 w-5 text-[var(--textMuted)]" aria-hidden />
              <div className="mt-2 font-medium text-[var(--text)]">
                {specialRequest.label}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--textMuted)]">
                {specialRequest.description}
              </p>
              <div className="mt-2 text-xs text-[var(--ice)]">
                Deposit {formatCents(specialRequest.depositCents)} · scope
                confirmed after we talk
              </div>
            </button>
          </div>
        </div>
      )}

      {step === "deliverables" && sessionId === "automotive" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--text)]">
              What do you want from the shoot?
            </h2>
            <p className="mt-1 text-sm text-[var(--textMuted)]">
              Select everything that applies. You can mix stills and motion.
              Prices stack on the stills base; each option below explains what
              can move the final quote.
            </p>
          </div>
          <div className="grid gap-2">
            {CAR_DELIVERABLES.map((d) => {
              const on = deliverableIds.includes(d.id);
              const priceLine =
                d.addonCents === 0
                  ? `Included in ${formatCents(AUTOMOTIVE_BASE_SESSION_CENTS)} base`
                  : `+${formatCents(d.addonCents)} on top of base`;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDeliverable(d.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    on
                      ? "border-[var(--ice)]/70 bg-[var(--ice)]/10 text-[var(--ice)]"
                      : "border-[var(--border)] bg-[var(--bg3)]/40 text-[var(--textMuted)] hover:text-[var(--text)]"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-[var(--text)]">{d.label}</span>
                    <span
                      className={`text-xs font-medium tabular-nums ${on ? "text-[var(--ice)]" : "text-[var(--textMuted)]"}`}
                    >
                      {priceLine}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--textMuted)]">
                    {d.description}
                  </p>
                </button>
              );
            })}
          </div>
          {deliverableIds.length > 0 && automotiveGuideTotal != null && (
            <p className="text-center text-sm text-[var(--text)]">
              <span className="text-[var(--textMuted)]">Your combo · </span>
              <span className="font-semibold tabular-nums text-[var(--ice)]">
                from {formatCents(automotiveGuideTotal)}
              </span>
              <span className="text-[var(--textMuted)]"> session guide</span>
            </p>
          )}
          <p className="text-center text-[11px] leading-relaxed text-[var(--textMuted)]">
            Travel, commercial use, overtime, or unusual locations can still add
            to the final invoice — we’ll spell that out before you’re committed
            beyond the deposit.
          </p>
          <button
            type="button"
            onClick={continueFromDeliverables}
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-3 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25"
          >
            Continue to summary
          </button>
        </div>
      )}

      {step === "summary" && selected && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-medium text-[var(--text)]">
              Review your request
            </h2>
            <p className="mt-1 text-sm text-[var(--textMuted)]">
              Confirm the basics, then add your contact details and notes on the
              next step.
            </p>
          </div>
          <dl className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/30 px-4 py-4 text-sm">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt className="text-[var(--textMuted)]">Session</dt>
              <dd className="font-medium text-[var(--text)]">{selected.label}</dd>
            </div>
            {sessionId === "automotive" && deliverableIds.length > 0 && (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-start">
                <dt className="text-[var(--textMuted)]">Deliverables</dt>
                <dd className="max-w-md text-right text-[var(--text)]">
                  {deliverableIds
                    .map(
                      (id) => CAR_DELIVERABLES.find((c) => c.id === id)?.label ?? id
                    )
                    .join(" · ")}
                </dd>
              </div>
            )}
            {sessionId === "automotive" &&
              deliverableIds.length > 0 &&
              automotiveGuideTotal != null && (
                <div className="flex flex-col gap-0.5 border-t border-[var(--border)] pt-3 sm:flex-row sm:justify-between">
                  <dt className="text-[var(--textMuted)]">Session guide (typical)</dt>
                  <dd className="font-semibold tabular-nums text-[var(--ice)]">
                    from {formatCents(automotiveGuideTotal)}
                  </dd>
                </div>
              )}
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt className="text-[var(--textMuted)]">Deposit (holds your spot)</dt>
              <dd className="font-medium text-[var(--ice)]">
                {formatCents(selected.depositCents)}
              </dd>
            </div>
          </dl>

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
            <span className="mt-1 block text-[11px] leading-relaxed text-[var(--textMuted)]">
              First choice of slot — I’ll confirm or suggest another before your
              deposit is treated as locked in.
            </span>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/30 hover:text-[var(--text)]"
            >
              Change selections
            </button>
            <button
              type="button"
              onClick={continueFromSummary}
              className="inline-flex items-center justify-center rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25"
            >
              Continue to contact
            </button>
          </div>
        </div>
      )}

      {step === "contact" && selected && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h2 className="text-lg font-medium text-[var(--text)]">
              Your details &amp; deposit
            </h2>
            <p className="mt-1 text-sm text-[var(--textMuted)]">
              Share car details, location ideas, references, and any must-have
              shots. Pay the deposit to hold your spot. If Stripe checkout is
              off, I’ll follow up by email instead.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/25 px-4 py-3 text-xs text-[var(--textMuted)]">
            <span className="font-medium text-[var(--text)]">Summary: </span>
            {selected.label}
            {sessionId === "automotive" && deliverableIds.length > 0 && (
              <>
                {" "}
                —{" "}
                {deliverableIds
                  .map(
                    (id) => CAR_DELIVERABLES.find((c) => c.id === id)?.label ?? id
                  )
                  .join(", ")}
              </>
            )}
            {sessionId === "automotive" &&
              deliverableIds.length > 0 &&
              automotiveGuideTotal != null && (
                <>
                  {" "}
                  · guide {formatCents(automotiveGuideTotal)}
                </>
              )}
            {startsAt && (
              <>
                {" "}
                ·{" "}
                {new Date(startsAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </>
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
              Notes for the photographer
            </span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Car / color / mods, meet spot ideas, mood, Instagram refs, questions…"
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
            ) : (
              `Pay deposit ${formatCents(selected.depositCents)}`
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
      )}

      {step === "path" && error && (
        <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {(step === "deliverables" || step === "summary") && error && (
        <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}
