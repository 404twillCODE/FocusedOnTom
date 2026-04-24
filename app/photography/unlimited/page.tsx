"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { LICENSE_TIERS, formatCents } from "@/lib/photography-config";
import { supabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/photography-analytics";

export default function UnlimitedPage() {
  const tier = LICENSE_TIERS.find((t) => t.id === "unlimited");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/photography/unlimited?auth=ready`
              : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout() {
    setError(null);
    setLoading(true);
    trackEvent("license_click", { license: "unlimited", source: "unlimited_page" });
    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) {
        setError("Sign in first — we sent a magic link above.");
        return;
      }
      const res = await fetch("/api/photo/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ license: "unlimited" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.status === 501) {
        setError(
          "Unlimited is not fully connected yet. Stripe keys need to be added in .env.local."
        );
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-12">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">Unlimited</span>
        </nav>

        <div className="mt-6 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--ice)]">
            <Sparkles className="h-3 w-3" />
            New · Unlimited plan
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.75rem]">
            Every photo, watermark-free, for one monthly price.
          </h1>
          <p className="max-w-xl text-[var(--textMuted)]">
            Perfect for desktop wallpapers, iPhone lock screens, mood boards,
            or printing personal copies. Cancel anytime from your account.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:px-6 sm:pb-32 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl">
            {tier?.name ?? "Unlimited"}
          </h2>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-[var(--text)]">
              {tier ? formatCents(tier.priceCents) : "$15"}
            </span>
            <span className="text-sm text-[var(--textMuted)]">/month</span>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-[var(--textMuted)]">
            {tier?.details.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ice)]" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Start Unlimited"
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-6 sm:p-8">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
            Step 1 · Sign in
          </h3>
          {sent ? (
            <div className="mt-4 rounded-lg border border-[var(--ice)]/30 bg-[var(--ice)]/10 px-4 py-3 text-sm text-[var(--ice)]">
              Check your inbox for a magic link, then click “Start Unlimited”
              again to go to checkout.
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="mt-3 space-y-3">
              <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/60"
                  placeholder="you@example.com"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg3)]/80 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/40 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-[var(--textMuted)]">
            We use magic links so you don&apos;t need a password. Your Unlimited
            status is tied to your email.
          </p>
        </div>
      </section>

      {error && (
        <div className="mx-auto -mt-16 max-w-3xl px-4 sm:px-6">
          <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        </div>
      )}
    </main>
  );
}
