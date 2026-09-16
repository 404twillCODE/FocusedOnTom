import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPlaces } from "@/lib/explore/data";
import { PLACE_TYPE_LABELS } from "@/lib/explore/types";
import { StatusBadge } from "@/components/explore/StatusBadge";

export const metadata: Metadata = {
  title: "Places",
  description: "Outdoor places across New York — parks, campsites, towers, trails, and water.",
};

export const dynamic = "force-dynamic";

export default async function PlacesIndexPage() {
  const places = await getPlaces();

  return (
    <section className="pb-24 pt-8 sm:pt-10">
      <div className="container-page">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          EXPLORE NEW YORK
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Places
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
          {places.length} locations in the atlas so far. Official records stay
          separate from personal notes.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <li key={place.id}>
              <Link
                href={`/explore/places/${place.slug}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg3)]/40 transition-colors hover:border-white/20"
              >
                {!place.coverImage ? null : (
                <div className="relative aspect-[16/10] bg-[var(--bg2)]">
                  <Image
                    src={place.coverImage}
                    alt={place.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                )}
                <div className="p-4">
                  <StatusBadge status={place.personalStatus} />
                  <h2 className="mt-2 text-lg font-medium text-[var(--text)]">
                    {place.name}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {PLACE_TYPE_LABELS[place.type]}
                    {place.county ? ` · ${place.county}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
