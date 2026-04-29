import { Suspense } from "react";
import { BookingForm } from "@/components/photography/BookingForm";
import { SESSION_TYPES } from "@/lib/photography-config";

export const metadata = {
  title: "Book a session",
  description:
    "Book car photography — statics, rollers, or short-form content — or send a special request.",
};

export default function BookingPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
            Book a session
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
          Car shoots first — everything else by request
        </h1>
        <p className="mt-3 max-w-xl text-[var(--textMuted)]">
          Choose a path and work through the steps — deposit, timing, and how
          pricing works are all in the note right under this.
        </p>

        <Suspense
          fallback={
            <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 px-5 py-10 text-center text-sm text-[var(--textMuted)] sm:px-8">
              Loading booking…
            </div>
          }
        >
          <BookingForm sessionTypes={SESSION_TYPES} />
        </Suspense>
      </section>
    </main>
  );
}
