import Link from "next/link";
import { ArrowLeft, Aperture, Camera, Gauge, Timer } from "lucide-react";
import { loadPhotographyData } from "@/lib/photography-source";

export const revalidate = 3600;

type Bin = { label: string; count: number };

function bins(values: string[], top = 8): Bin[] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

function Bar({ bins, title, icon }: { bins: Bin[]; title: string; icon: React.ReactNode }) {
  const total = bins.reduce((acc, b) => acc + b.count, 0);
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
      <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
        {icon}
        {title}
      </h3>
      {bins.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--textMuted)]">No data yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5 text-sm">
          {bins.map((b) => {
            const pct = Math.round((b.count / max) * 100);
            const sharePct = total > 0 ? Math.round((b.count / total) * 100) : 0;
            return (
              <li key={b.label} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[var(--text)]">{b.label}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg3)]">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-[var(--ice)]/70"
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-[var(--textMuted)]">
                  {b.count} · {sharePct}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default async function StatsPage() {
  const cameras: string[] = [];
  const lenses: string[] = [];
  const focals: string[] = [];
  const shutters: string[] = [];
  const apertures: string[] = [];
  const isos: string[] = [];
  let totalPhotos = 0;
  let totalEvents = 0;

  const { categories } = await loadPhotographyData();
  for (const cat of categories) {
    for (const ev of cat.events) {
      totalEvents += 1;
      for (const p of ev.photos) {
        totalPhotos += 1;
        const e = p.exif;
        if (!e) continue;
        if (e.camera) cameras.push(e.camera);
        if (e.lens) lenses.push(e.lens);
        if (e.focal) focals.push(e.focal);
        if (e.shutter) shutters.push(e.shutter);
        if (e.aperture) apertures.push(e.aperture);
        if (e.iso) isos.push(String(e.iso));
      }
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 sm:pt-28">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">Shot on</span>
        </nav>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.5rem]">
          Shot on
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--textMuted)]">
          Auto-generated from the EXIF of every public photo I&apos;ve posted.
          Across <b>{totalPhotos}</b> photos in{" "}
          <b>{totalEvents}</b> galleries.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6 sm:pb-32">
        <Bar title="Cameras" bins={bins(cameras)} icon={<Camera className="h-3.5 w-3.5" />} />
        <Bar title="Lenses" bins={bins(lenses)} icon={<Camera className="h-3.5 w-3.5" />} />
        <Bar title="Focal length" bins={bins(focals)} icon={<Gauge className="h-3.5 w-3.5" />} />
        <Bar title="Aperture" bins={bins(apertures)} icon={<Aperture className="h-3.5 w-3.5" />} />
        <Bar title="Shutter speed" bins={bins(shutters)} icon={<Timer className="h-3.5 w-3.5" />} />
        <Bar title="ISO" bins={bins(isos)} icon={<Gauge className="h-3.5 w-3.5" />} />
      </section>
    </main>
  );
}
