"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  buildTeVisualsAccountUrl,
  isTeVisualsPublicTargetAllowed,
} from "@/lib/tevisuals-public-shop-url";

const AUTO_REDIRECT_MS = 1_700;

export function PhotographyBuyRedirectClient() {
  const searchParams = useSearchParams();
  const targetRaw = searchParams.get("target") ?? "";
  const target = useMemo(() => {
    try {
      return targetRaw.trim() ? decodeURIComponent(targetRaw.trim()) : "";
    } catch {
      return "";
    }
  }, [targetRaw]);

  const allowed = Boolean(target && isTeVisualsPublicTargetAllowed(target));
  const fallbackAccount = buildTeVisualsAccountUrl();

  useEffect(() => {
    if (!allowed) return;
    const id = window.setTimeout(() => {
      window.location.assign(target);
    }, AUTO_REDIRECT_MS);
    return () => clearTimeout(id);
  }, [allowed, target]);

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 pt-24 pb-24 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
          Photography
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
          Redirecting you to TE Visuals
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--textMuted)]">
          Purchases and downloads are handled securely through TE Visuals.
        </p>

        {allowed ? (
          <div className="mt-8 flex flex-col gap-4">
            <a
              href={target}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/10 px-6 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20"
            >
              Continue to TE Visuals
            </a>
            <p className="text-center text-xs text-[var(--textMuted)]">
              If nothing happens, tap the button above.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p>
              This link is missing or does not point at the configured TE
              Visuals site. Check{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
                NEXT_PUBLIC_TEVISUALS_PUBLIC_URL
              </code>{" "}
              and try again from the gallery.
            </p>
            {fallbackAccount ? (
              <a
                href={fallbackAccount}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-[var(--ice)] underline-offset-4 hover:underline"
              >
                Open TE Visuals account
              </a>
            ) : null}
            <Link
              href="/photography"
              className="block text-xs text-[var(--textMuted)] hover:text-[var(--ice)]"
            >
              ← Back to photography
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
