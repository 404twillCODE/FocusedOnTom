import type { Metadata } from "next";
import { getExploreStats, getPlaces } from "@/lib/explore/data";
import { CollectionMap } from "@/components/explore/dynamic-maps";

export const metadata: Metadata = {
  title: "My Progress",
  description: "How New York is filling in — parks, nights camped, towers, and miles.",
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const stats = await getExploreStats();
  const visited = (await getPlaces()).filter((p) => p.personalStatus === "visited");

  const cards = [
    { label: "Places visited", value: stats.placesVisited },
    { label: "State Parks", value: stats.stateParksVisited },
    { label: "Nights camped", value: stats.nightsCamped },
    { label: "Fire towers", value: stats.fireTowersVisited },
    { label: "Primitive campsites", value: stats.primitiveCampsites },
    { label: "Boat launches", value: stats.boatLaunches },
    { label: "Lakes", value: stats.lakesVisited },
    { label: "Fishing access", value: stats.fishingAccess },
    { label: "Trip miles", value: stats.milesTraveled },
    { label: "Photos attached", value: stats.photos },
  ];

  return (
    <section className="pb-24 pt-8 sm:pt-10">
      <div className="container-page">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          EXPLORE NEW YORK
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          My Progress
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
          {stats.placesVisited} of {stats.placesTotal} places in the atlas so
          far. The map fills in as visits are logged.
        </p>

        <div className="mt-8 h-[380px] overflow-hidden rounded-2xl border border-white/10">
          <CollectionMap places={visited} />
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {cards.map((card) => (
            <li
              key={card.label}
              className="rounded-2xl border border-white/10 bg-[var(--bg3)]/40 px-4 py-5"
            >
              <p className="text-2xl font-semibold text-[var(--text)]">
                {card.value}
              </p>
              <p className="mt-1 text-xs tracking-[0.08em] text-[var(--text-muted)]">
                {card.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
