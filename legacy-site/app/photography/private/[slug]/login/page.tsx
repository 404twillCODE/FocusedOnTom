"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { use } from "react";
import { trackEvent } from "@/lib/photography-analytics";

type Props = { params: Promise<{ slug: string }> };

export default function PrivateLoginPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? `/photography/private/${slug}`;
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/private/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Wrong password.");
        return;
      }
      trackEvent("private_login", { slug });
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <Link
          href="/photography"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to photography
        </Link>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-6 sm:p-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ice)]/30 bg-[var(--ice)]/10 text-[var(--ice)]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Private gallery
          </h1>
          <p className="mt-1 text-sm text-[var(--textMuted)]">
            Enter the password you received. The link stays signed in on this
            device for 30 days.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
              Password
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/60"
              />
            </label>
            {error && (
              <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-4 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock gallery"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
