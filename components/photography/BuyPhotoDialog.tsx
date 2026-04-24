"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import {
  LICENSE_TIERS,
  PHOTO_BRAND,
  formatCents,
} from "@/lib/photography-config";
import { trackEvent } from "@/lib/photography-analytics";
import type { LicenseId } from "@/lib/photography-types";
import type { Photo } from "@/lib/photography";

type BuyPhotoDialogProps = {
  photo: Photo;
  open: boolean;
  onClose: () => void;
};

export function BuyPhotoDialog({ photo, open, onClose }: BuyPhotoDialogProps) {
  const [pending, setPending] = useState<LicenseId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPending(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onPick(license: LicenseId) {
    setError(null);
    setPending(license);
    trackEvent("license_click", {
      photo_id: photo.id ?? photo.src,
      license,
    });
    try {
      const res = await fetch("/api/photo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_id: photo.id,
          photo_path: photo.path,
          license,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        mailto?: string;
      };
      if (res.status === 501 || data.error === "stripe_not_configured") {
        const subject = encodeURIComponent(
          `Photo purchase: ${photo.id ?? "photo"} (${license})`
        );
        const body = encodeURIComponent(
          `Hey Tom,\n\nI'd like to buy this photo (${license} license):\n${photo.src}\n\nThanks!`
        );
        window.location.href = `mailto:${PHOTO_BRAND.contactEmail}?subject=${subject}&body=${body}`;
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message ?? "Network error");
    } finally {
      setPending(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Buy photo"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                Choose a license
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              Pick how you&apos;ll use this photo
            </h2>
            <p className="mt-2 max-w-lg text-sm text-[var(--textMuted)]">
              Every license unlocks a clean, watermark-free copy. Pay once for
              single-use or subscribe for unlimited downloads.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LICENSE_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => onPick(tier.id)}
                  disabled={pending !== null}
                  className={`group relative flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/40 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ice)]/60 hover:bg-[var(--bg3)]/70 disabled:cursor-not-allowed disabled:opacity-60 ${
                    tier.subscription ? "ring-1 ring-[var(--ice)]/30" : ""
                  }`}
                >
                  {tier.subscription && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--ice)]/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ice)]">
                      <Sparkles className="h-3 w-3" />
                      Best value
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">
                      {tier.name}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tracking-tight text-[var(--text)]">
                        {formatCents(tier.priceCents)}
                      </span>
                      {tier.subscription && (
                        <span className="text-xs text-[var(--textMuted)]">
                          /mo
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-[var(--textMuted)]">
                      {tier.tagline}
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[var(--textMuted)]">
                    {tier.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-[var(--ice)]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-medium text-[var(--text)] transition-colors group-hover:border-[var(--ice)]/50 group-hover:text-[var(--ice)]">
                    {pending === tier.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : tier.subscription ? (
                      "Start subscription"
                    ) : (
                      "Buy · " + formatCents(tier.priceCents)
                    )}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            <p className="mt-6 text-xs text-[var(--textMuted)]">
              Secure payment via Stripe. Personal and Commercial licenses send
              a download link by email. Unlimited requires a quick account
              (magic link).
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
