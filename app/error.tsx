"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-xl font-semibold text-[var(--text)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--textMuted)]">
          We couldn’t load this page. You can try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)]/30 px-4 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--iceSoft)]/50"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-4 py-2.5 text-sm font-medium text-[var(--textMuted)] transition-colors hover:text-[var(--text)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
