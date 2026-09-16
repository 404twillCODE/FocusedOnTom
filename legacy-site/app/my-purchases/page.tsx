"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { formatCents } from "@/lib/photography-config";
import {
  buildPhotographyBuyRedirectUrl,
  buildTeVisualsAccountUrl,
  isClientTeVisualsPhotographySource,
} from "@/lib/tevisuals-public-shop-url";

type PurchasePhoto = {
  id: string;
  filename: string;
  public_url: string;
  width: number;
  height: number;
  gallery_slug?: string;
  price_cents?: number;
  access: "purchase" | "subscription";
};

export default function MyPurchasesPage() {
  if (isClientTeVisualsPhotographySource()) return <TeVisualsMyPurchasesCallout />;
  return <FocusedOnTomMyPurchases />;
}

/** TE-backed catalog — purchases/downloads are hosted on TE Visuals. */
function TeVisualsMyPurchasesCallout() {
  const accountUrl = buildTeVisualsAccountUrl();
  const viaRedirect = accountUrl
    ? buildPhotographyBuyRedirectUrl(accountUrl)
    : null;

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-24 sm:px-6 sm:pt-28">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">My purchases</span>
        </nav>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/70 p-8 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
            Purchases live on TE Visuals
          </h1>
          <p className="mt-3 max-w-xl text-[var(--textMuted)]">
            View invoices, downloads, and license details on TE Visuals — this
            site only mirrors the portfolio.
          </p>
          <p className="mt-2 text-xs text-white/45">
            Set{" "}
            <code className="rounded bg-black/35 px-1 py-px text-[var(--ice)]">
              NEXT_PUBLIC_TEVISUALS_PUBLIC_URL
            </code>{" "}
            if the button below is unavailable.
          </p>
          {viaRedirect ? (
            <Link
              href={viaRedirect}
              className="mt-6 inline-flex rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/12 px-5 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20"
            >
              View purchases on TE Visuals
            </Link>
          ) : (
            <p className="mt-6 text-sm text-amber-100/95">
              Add{" "}
              <code className="rounded bg-black/35 px-1">
                NEXT_PUBLIC_TEVISUALS_PUBLIC_URL
              </code>{" "}
              (same origin as TE Visuals) to enable outbound links from this site.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function FocusedOnTomMyPurchases() {
  const [photos, setPhotos] = useState<PurchasePhoto[]>([]);
  const [unlimited, setUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = getFOYSupabase();
        const { data: auth } = await supabase.auth.getSession();
        const token = auth.session?.access_token;
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        setSignedIn(true);
        const res = await fetch("/api/photo/purchases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as {
          photos?: PurchasePhoto[];
          unlimited?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Could not load purchases");
        if (!cancelled) {
          setPhotos(data.photos ?? []);
          setUnlimited(!!data.unlimited);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load purchases");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function downloadOriginal(photoId: string) {
    setDownloading(photoId);
    setError("");
    try {
      const supabase = getFOYSupabase();
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) throw new Error("Sign in again to download.");
      const res = await fetch(`/api/photo/original/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Download unavailable");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download unavailable");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-24 sm:px-6 sm:pt-28">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">My purchases</span>
        </nav>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              My purchases
            </h1>
            <p className="mt-2 max-w-xl text-[var(--textMuted)]">
              Download the full-quality originals you paid for. Unlimited members can
              download any available original while the subscription is active.
            </p>
          </div>
          {unlimited ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ice)]/30 bg-[var(--iceSoft)] px-4 py-2 text-sm text-[var(--ice)]">
              <Sparkles className="h-4 w-4" />
              Unlimited active
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-14 text-[var(--textMuted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : !signedIn ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-14 text-center">
              <p className="text-base font-medium text-[var(--text)]">
                Sign in to see your purchases.
              </p>
              <p className="mt-1 text-sm text-[var(--textMuted)]">
                Use the same email you used for checkout.
              </p>
              <Link
                href="/focusedonyou/auth?next=/my-purchases"
                className="mt-4 inline-flex rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-4 py-2 text-sm font-medium text-[var(--ice)]"
              >
                Sign in
              </Link>
            </div>
          ) : photos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-14 text-center">
              <p className="text-base font-medium text-[var(--text)]">
                No accessible photos yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60"
                >
                  <div className="aspect-[4/3] bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.public_url}
                      alt={photo.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text)]">
                          {photo.filename}
                        </p>
                        <p className="mt-1 text-xs text-[var(--textMuted)]">
                          {photo.gallery_slug ?? "Photo"} ·{" "}
                          {photo.price_cents ? formatCents(photo.price_cents) : "Included"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--textMuted)]">
                        {photo.access}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadOriginal(photo.id)}
                      disabled={downloading === photo.id}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-2 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20 disabled:opacity-60"
                    >
                      {downloading === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download original
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
