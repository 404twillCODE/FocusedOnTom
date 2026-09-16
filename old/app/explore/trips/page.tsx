import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTrips } from "@/lib/explore/data";

export const metadata: Metadata = {
  title: "Trips",
  description: "Adventures across New York — routes, stops, and nights out.",
};

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <section className="pb-24 pt-8 sm:pt-10">
      <div className="container-page">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          EXPLORE NEW YORK
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Trips
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
          A trip is a whole adventure, not a single pin. Stops point back to
          shared Place records.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/explore/trips/${trip.slug}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg3)]/40"
              >
                <div className="relative aspect-[16/8] bg-[var(--bg2)]">
                  {trip.coverImage && (
                    <Image
                      src={trip.coverImage}
                      alt={trip.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-[var(--text-muted)]">
                    {trip.startDate}
                    {trip.endDate ? ` – ${trip.endDate}` : ""}
                  </p>
                  <h2 className="mt-1 text-xl font-medium">{trip.title}</h2>
                  {trip.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">
                      {trip.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
