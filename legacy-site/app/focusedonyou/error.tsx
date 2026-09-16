"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { FOYContainer, FOYCard, FOYButton } from "@/app/focusedonyou/_components";

export default function FocusedOnYouError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("FocusedOnYou error boundary:", error);
    }
  }, [error]);

  return (
    <div className="focusedonyou-no-zoom flex min-h-screen items-center justify-center px-4">
      <FOYContainer className="py-12">
        <FOYCard className="flex max-w-sm flex-col items-center text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--iceSoft)] text-[var(--ice)]"
            aria-hidden
          >
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-[var(--text)]">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-[var(--textMuted)]">
            We couldn’t load this page. Try again or go back.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <FOYButton variant="primary" onClick={reset}>
              Try again
            </FOYButton>
            <FOYButton
              variant="secondary"
              onClick={() => window.location.assign("/focusedonyou")}
            >
              Go to home
            </FOYButton>
          </div>
        </FOYCard>
      </FOYContainer>
    </div>
  );
}
