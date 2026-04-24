"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatCents } from "@/lib/photography-config";

type PurchaseRow = {
  id: string;
  photo_id: string;
  photo_path: string;
  license: string;
  amount_cents: number;
  status: string;
  download_token: string | null;
  expires_at: string | null;
  created_at: string;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: auth } = await supabase.auth.getSession();
        const token = auth.session?.access_token;
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        setSignedIn(true);
        const { data, error } = await supabase
          .from("photo_orders")
          .select(
            "id, photo_id, photo_path, license, amount_cents, status, download_token, expires_at, created_at"
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setPurchases((data ?? []) as PurchaseRow[]);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-24 sm:px-6 sm:pt-28">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">Your purchases</span>
        </nav>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          Your purchases
        </h1>
        <p className="mt-2 max-w-lg text-[var(--textMuted)]">
          Re-download any photo you&apos;ve purchased, while the link is still
          valid. Each link allows up to 5 downloads within 7 days of purchase.
        </p>

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
                Guest purchases are sent via the email on your Stripe receipt.
              </p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-14 text-center">
              <p className="text-base font-medium text-[var(--text)]">
                No purchases yet.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {purchases.map((p) => {
                const expired =
                  p.expires_at && new Date(p.expires_at).getTime() < Date.now();
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-[var(--textMuted)]">
                        {p.photo_path || p.photo_id}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--textMuted)]">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-0.5 capitalize">
                          {p.license}
                        </span>
                        <span>{formatCents(p.amount_cents)}</span>
                        <span>·</span>
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {p.download_token && !expired ? (
                      <Link
                        href={`/api/photo/download/${p.download_token}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-1.5 text-xs font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Link>
                    ) : (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-xs text-[var(--textMuted)]">
                        Link expired
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
