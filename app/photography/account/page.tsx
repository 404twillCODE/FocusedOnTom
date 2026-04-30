"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LogIn, User, UserPlus } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";

type AuthMode = "signin" | "signup";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PhotographyAccountPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart dev server."
      );
      return;
    }
    let alive = true;
    const supabase = getFOYSupabase();
    void supabase.auth.getSession().then((result: { data: { session: { user: { email?: string } } | null } }) => {
      if (!alive) return;
      setSessionEmail(result.data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: { user?: { email?: string } } | null) => {
      setSessionEmail(session?.user?.email ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || loading) return;
    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart dev server."
      );
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = getFOYSupabase();
      const trimmedEmail = email.trim();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.session?.user?.email) {
          setSessionEmail(data.session.user.email);
        } else {
          setMessage("Account created. Check your email to confirm it, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
        setSessionEmail(data.user?.email ?? trimmedEmail);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart dev server."
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getFOYSupabase();
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
            Use an email and password to manage purchases and download originals.
          </p>

          {sessionEmail ? (
            <div className="mt-5 rounded-xl border border-[var(--ice)]/30 bg-[var(--ice)]/10 p-4">
              <p className="text-sm text-[var(--text)]">
                Signed in as <span className="font-medium">{sessionEmail}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/my-purchases"
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
            <form onSubmit={handleAuth} className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                    mode === "signin"
                      ? "bg-[var(--ice)]/15 text-[var(--ice)]"
                      : "text-[var(--textMuted)] hover:text-[var(--text)]"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                    mode === "signup"
                      ? "bg-[var(--ice)]/15 text-[var(--ice)]"
                      : "text-[var(--textMuted)] hover:text-[var(--text)]"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </button>
              </div>
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
              <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
                Password
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/60"
                  placeholder="Your password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={6}
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
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  mode === "signin" ? "Sign in" : "Create account"
                )}
              </button>
            </form>
          )}

          {message && !sessionEmail && (
            <p className="mt-3 text-sm text-[var(--ice)]">
              {message}
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
