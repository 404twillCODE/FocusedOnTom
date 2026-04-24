import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
export const revalidate = 3600;

export default function MapPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-6 sm:px-6 sm:pt-28">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">Map</span>
        </nav>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.5rem]">
              Map view disabled
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--textMuted)]">
              Your camera files currently do not include consistent GPS
              coordinates, so the map feature is turned off.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-xs font-mono text-[var(--textMuted)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--ice)]" />
            GPS disabled
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-14 text-center text-sm text-[var(--textMuted)]">
          Map rendering is currently disabled.
          <br />
          If you switch to a camera/workflow with GPS EXIF later, we can turn it
          back on quickly.
        </div>

        {/*
          Map temporarily disabled:
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <PhotographyMapLoader
              pins={pins.map((p) => ({
                ...p,
                href: eventPageHref(p.categorySlug, p.eventSlug),
              }))}
            />
          </div>
        */}
      </section>
    </main>
  );
}
