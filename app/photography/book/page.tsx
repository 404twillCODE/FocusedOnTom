import { BookingForm } from "@/components/photography/BookingForm";
import { SESSION_TYPES } from "@/lib/photography-config";

export const metadata = {
  title: "Book a session",
  description: "Reserve a photography session — portrait, event, or automotive.",
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
          Let&apos;s shoot something good
        </h1>
        <p className="mt-3 max-w-xl text-[var(--textMuted)]">
          Pick a session type and pitch me a day &amp; time. I&apos;ll confirm
          availability before the deposit clears.
        </p>

        <BookingForm sessionTypes={SESSION_TYPES} />
      </section>
    </main>
  );
}
