"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function PhotographyAccountPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSessionEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/photography/account`
              : undefined,
        },
      });
      if (signInError) throw signInError;
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSessionEmail(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">Account</span>
        </nav>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-6 sm:p-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ice)]/30 bg-[var(--ice)]/10 text-[var(--ice)]">
            <User className="h-4 w-4" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
            Sign in or create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--textMuted)]">
            Use your email and we&apos;ll send a magic link. No password needed.
          </p>

          {sessionEmail ? (
            <div className="mt-5 rounded-xl border border-[var(--ice)]/30 bg-[var(--ice)]/10 p-4">
              <p className="text-sm text-[var(--text)]">
                Signed in as <span className="font-medium">{sessionEmail}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/photography/purchases"
                  className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/70 px-3 py-1.5 text-xs text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
                >
                  View purchases
                </Link>
                <Link
                  href="/photography/unlimited"
                  className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/70 px-3 py-1.5 text-xs text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
                >
                  Unlimited plan
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={loading}
                  className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200 transition-colors hover:bg-rose-400/20 disabled:opacity-60"
                >
                  {loading ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="mt-5 space-y-3">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-4 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>
          )}

          {sent && !sessionEmail && (
            <p className="mt-3 text-sm text-[var(--ice)]">
              Magic link sent. Check your inbox and click the link to finish
              sign in.
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-rose-300">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
