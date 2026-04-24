"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Download,
  Heart,
  Loader2,
  Package,
  Send,
  Sparkles,
} from "lucide-react";
import type { Photo } from "@/lib/photography";
import type { PrivateGalleryState } from "@/lib/photography-types";
import { Lightbox } from "@/components/Lightbox";
import { trackEvent } from "@/lib/photography-analytics";

type FinalPhoto = { path: string; url: string };

type Props = {
  slug: string;
  state: PrivateGalleryState;
  photos: Photo[];
  initialFavorites: string[];
  finalPhotos: FinalPhoto[];
  allowAllZip: boolean;
  submitted: boolean;
  finalMessage: string | null;
};

export function PrivateGalleryView({
  slug,
  state,
  photos,
  initialFavorites,
  finalPhotos,
  allowAllZip,
  submitted: submittedInit,
  finalMessage,
}: Props) {
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(initialFavorites)
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(submittedInit);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(state === "approved");
  const [err, setErr] = useState<string | null>(null);

  const inEditing = state === "editing" || submitted;
  const showProofing = state === "proofing" && !submitted;
  const showFinal =
    state === "final_delivery" || state === "approved" || finalPhotos.length > 0;

  const favCount = favorites.size;

  const pathByIndex = useMemo(
    () => photos.map((p) => p.path ?? p.src),
    [photos]
  );

  async function toggleFavorite(photoPath: string) {
    if (!showProofing) return;
    const next = new Set(favorites);
    const wasFav = next.has(photoPath);
    if (wasFav) next.delete(photoPath);
    else next.add(photoPath);
    setFavorites(next);
    try {
      const res = await fetch("/api/private/favorite", {
        method: wasFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_path: photoPath }),
      });
      if (!res.ok) throw new Error(String(res.status));
      trackEvent("private_favorite", {
        slug,
        action: wasFav ? "remove" : "add",
      });
    } catch {
      // roll back on failure
      setFavorites(favorites);
    }
  }

  async function submitFavorites() {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/private/submit-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "failed");
      setSubmitted(true);
      trackEvent("private_submit", { slug, count: favCount });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function approve() {
    setErr(null);
    setApproving(true);
    try {
      const res = await fetch("/api/private/approve", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "failed");
      setApproved(true);
      trackEvent("private_approve", { slug });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setApproving(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        {/* Action strip — changes with state */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[var(--textMuted)]">
            <Heart className="h-3.5 w-3.5 text-[var(--ice)]" />
            {favCount} selected of {photos.length}
          </div>
          <div className="flex items-center gap-2">
            {showProofing && (
              <button
                type="button"
                onClick={submitFavorites}
                disabled={submitting || favCount === 0}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-2 text-xs font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit selections
              </button>
            )}
            {(state === "final_delivery" || state === "approved") && (
              <Link
                href={`/api/private/zip?mode=favorites`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg3)]/70 px-4 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/40"
              >
                <Download className="h-3.5 w-3.5" />
                Favorites ZIP
              </Link>
            )}
            {allowAllZip && (
              <Link
                href={`/api/private/zip?mode=all`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg3)]/70 px-4 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/40"
              >
                <Package className="h-3.5 w-3.5" />
                All ZIP
              </Link>
            )}
            {finalPhotos.length > 0 && (
              <Link
                href={`/api/private/zip?mode=final`}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Final ZIP
              </Link>
            )}
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}

        {submitted && state !== "final_delivery" && state !== "approved" && (
          <div className="mt-3 rounded-lg border border-[var(--ice)]/30 bg-[var(--ice)]/10 px-3 py-2 text-sm text-[var(--ice)]">
            Submitted · I&apos;ll get these edited and flip the gallery to “Final
            delivery” when ready.
          </div>
        )}

        {showFinal && finalMessage && (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {finalMessage}
          </div>
        )}

        {state === "final_delivery" && !approved && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            <span>Review your final photos below, then approve when happy.</span>
            <button
              type="button"
              onClick={approve}
              disabled={approving}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-500/30 disabled:opacity-60"
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Approve
            </button>
          </div>
        )}

        {approved && (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Approved — thanks! Download anytime.
          </div>
        )}
      </section>

      {showFinal && finalPhotos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <h2 className="mt-6 text-lg font-semibold tracking-tight text-[var(--text)]">
            Final edits
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {finalPhotos.map((p) => (
              <li
                key={p.path}
                className="overflow-hidden rounded-xl border border-emerald-400/30 bg-emerald-500/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt="Final edit"
                  className="h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        <h2 className="mt-6 text-lg font-semibold tracking-tight text-[var(--text)]">
          {inEditing ? "Your proofing selections" : "Browse and select"}
        </h2>
        <ul className="masonry mt-4">
          {photos.map((photo, i) => {
            const photoPath = pathByIndex[i];
            const isFav = favorites.has(photoPath);
            return (
              <li key={photo.id ?? photo.src}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", bounce: 0.35 }}
                  className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg3)]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className="block w-full"
                    aria-label={`Open photo: ${photo.alt}`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </button>
                  {showProofing && (
                    <button
                      type="button"
                      aria-label={isFav ? "Remove selection" : "Select photo"}
                      onClick={() => toggleFavorite(photoPath)}
                      className={`absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                        isFav
                          ? "border-rose-400/60 bg-rose-500/80 text-white"
                          : "border-white/30 bg-black/40 text-white/80 backdrop-blur hover:bg-black/60"
                      }`}
                    >
                      {isFav ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  {!showProofing && isFav && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--ice)]">
                      Selected
                    </span>
                  )}
                </motion.div>
              </li>
            );
          })}
        </ul>
      </section>

      <Lightbox
        photos={photos}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onIndexChange={setActiveIndex}
      />
    </>
  );
}
