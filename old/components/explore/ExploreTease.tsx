import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  getExploreStats,
  getLatestTrip,
  getPlaces,
  getRecentPhotos,
} from "@/lib/explore/data";
import { CollectionMap } from "@/components/explore/dynamic-maps";

export async function ExploreTease() {
  const stats = await getExploreStats();
  const trip = await getLatestTrip();
  const photos = await getRecentPhotos(3);
  const visited = (await getPlaces()).filter((p) => p.personalStatus === "visited");

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.24em] text-[var(--text-muted)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                EXPLORE NEW YORK
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Documenting New York
                <span className="text-[var(--accent)]"> one place at a time.</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
                Parks, primitive sites, fire towers, and the trips between them
                — a living atlas that stays personal, not governmental.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { n: stats.placesVisited, l: "Places explored" },
                  { n: stats.nightsCamped, l: "Nights camped" },
                  { n: stats.stateParksVisited, l: "State Parks" },
                  { n: stats.fireTowersVisited, l: "Fire towers" },
                ].map((item) => (
                  <div
                    key={item.l}
                    className="rounded-xl border border-white/10 px-3 py-3"
                  >
                    <dt className="text-2xl font-semibold">{item.n}</dt>
                    <dd className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {item.l}
                    </dd>
                  </div>
                ))}
              </dl>
              {trip && (
                <p className="mt-5 text-sm text-[var(--text-muted)]">
                  Latest trip:{" "}
                  <Link
                    href={`/explore/trips/${trip.slug}`}
                    className="text-[var(--text)] hover:text-[var(--accent-light)]"
                  >
                    {trip.title}
                  </Link>
                </p>
              )}
              <Link
                href="/explore"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-2.5 text-xs font-medium tracking-[0.16em] text-[var(--accent-light)]"
              >
                OPEN EXPLORE MAP
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="h-[280px]">
                <CollectionMap places={visited} />
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 border-t border-white/10">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square">
                      <Image
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
