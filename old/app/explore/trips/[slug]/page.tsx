import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getGoalsForTrip,
  getMediaForTrip,
  getStopsForTrip,
  getTripBySlug,
} from "@/lib/explore/data";
import { TripRouteMap } from "@/components/explore/dynamic-maps";
import { PLACE_TYPE_LABELS } from "@/lib/explore/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  return { title: trip?.title ?? "Trip", description: trip?.description };
}

export default async function TripPage({ params }: Props) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const stops = await getStopsForTrip(trip.id);
  const media = await getMediaForTrip(trip.id);
  const goals = await getGoalsForTrip(trip.id);

  return (
    <article className="pb-24 pt-8 sm:pt-10">
      <div className="container-page max-w-5xl">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          <Link href="/explore/trips" className="hover:text-[var(--text)]">
            TRIPS
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          {trip.title}
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          {trip.startDate}
          {trip.endDate ? ` – ${trip.endDate}` : ""}
          {trip.milesTraveled ? ` · ${trip.milesTraveled} miles` : ""}
        </p>
        {trip.description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-muted)]">
            {trip.description}
          </p>
        )}

        <div className="mt-8 h-[360px] overflow-hidden rounded-2xl border border-white/10">
          <TripRouteMap
            stops={stops
              .filter((s) => s.place)
              .map((s) => ({
                order: s.order,
                name: s.place!.name,
                latitude: s.place!.latitude,
                longitude: s.place!.longitude,
              }))}
          />
        </div>

        <ol className="mt-8 space-y-3">
          {stops.map((stop) => (
            <li key={stop.id}>
              {stop.place ? (
                <Link
                  href={`/explore/places/${stop.place.slug}`}
                  className="flex gap-4 rounded-xl border border-white/10 px-4 py-3 hover:border-white/20"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm text-[var(--accent-light)]">
                    {stop.order}
                  </span>
                  <span>
                    <span className="block font-medium">{stop.place.name}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {PLACE_TYPE_LABELS[stop.place.type]}
                      {stop.notes ? ` · ${stop.notes}` : ""}
                    </span>
                  </span>
                </Link>
              ) : null}
            </li>
          ))}
        </ol>

        {trip.highlights && trip.highlights.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Highlights</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {trip.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        {goals.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Trip goals</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {goals.map((g) => (
                <li key={g.id} className="rounded-xl border border-white/10 px-4 py-3">
                  {g.title}{" "}
                  <span className="text-[var(--text-muted)]">({g.status})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {media.length > 0 && (
          <section className="mt-10 grid gap-3 sm:grid-cols-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10"
              >
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </section>
        )}
      </div>
    </article>
  );
}
