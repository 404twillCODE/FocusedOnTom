import { Suspense } from "react";
import { PhotographyBuyRedirectClient } from "./redirect-client";

export default function PhotographyBuyRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen">
          <section className="mx-auto max-w-lg px-4 pt-24 pb-24 sm:px-6">
            <p className="text-sm text-[var(--textMuted)]">Loading…</p>
          </section>
        </main>
      }
    >
      <PhotographyBuyRedirectClient />
    </Suspense>
  );
}
