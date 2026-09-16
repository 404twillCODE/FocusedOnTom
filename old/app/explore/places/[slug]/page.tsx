import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCampsites,
  getFieldReport,
  getGoalsForPlace,
  getMediaForPlace,
  getPlaceBySlug,
  getVisitsForPlace,
} from "@/lib/explore/data";
import { PLACE_TYPE_LABELS } from "@/lib/explore/types";
import { StatusBadge } from "@/components/explore/StatusBadge";
import { PlaceMiniMap } from "@/components/explore/dynamic-maps";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  return {
    title: place ? place.name : "Place",
    description: place?.description,
  };
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const visits = await getVisitsForPlace(place.id);
  const media = await getMediaForPlace(place.id);
  const goals = await getGoalsForPlace(place.id);
  const report = await getFieldReport(place.id);
  const campsites = await getCampsites(place.id);
  const official = place.officialPlaceData;

  return (
    <article className="pb-24 pt-8 sm:pt-10">
      <div className="container-page max-w-5xl">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          <Link href="/explore/places" className="hover:text-[var(--text)]">
            PLACES
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              {place.name}
            </h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {PLACE_TYPE_LABELS[place.type]}
              {place.county ? ` · ${place.county} County` : ""}
              {place.region ? ` · ${place.region}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
            </p>
            <div className="mt-3">
              <StatusBadge status={place.personalStatus} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-white/10">
            {place.coverImage ? (
              <Image
                src={place.coverImage}
                alt={place.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="h-full min-h-[240px] bg-[var(--bg2)]" />
            )}
          </div>
          <PlaceMiniMap
            latitude={place.latitude}
            longitude={place.longitude}
            status={place.personalStatus}
          />
        </div>

        <section className="mt-12 rounded-2xl border border-white/10 bg-[var(--bg3)]/30 p-6">
          <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--text-muted)]">
            OFFICIAL INFORMATION
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Public / government source — not a personal or community report.
          </p>
          {(official?.officialDescription || (!official && place.description)) && (
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text)]">
              {official?.officialDescription || place.description}
            </p>
          )}
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <Info
              label="Agency"
              value={
                place.managingAgency ||
                place.officialSource?.agency ||
                (official ? "NYS DEC" : "—")
              }
            />
            {official?.facility && <Info label="Facility / unit" value={[official.facility, official.unit].filter(Boolean).join(" · ")} />}
            {official?.asset && <Info label="Official asset type" value={official.asset} />}
            {place.officialSource?.name && (
              <Info label="Source" value={place.officialSource.name} />
            )}
            {official?.sourceRecordId && (
              <Info label="Source record" value={official.sourceRecordId} />
            )}
            {official?.accessibility && (
              <Info label="Accessibility" value={official.accessibility} />
            )}
            <Info
              label="Coordinates"
              value={`${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`}
            />
            {official?.lastImportedAt && (
              <Info
                label="Last official import"
                value={official.lastImportedAt.slice(0, 10)}
              />
            )}
            {place.officialWebsite && (
              <div>
                <dt className="text-xs tracking-[0.14em] text-[var(--text-muted)]">
                  Official website
                </dt>
                <dd className="mt-1">
                  <a
                    href={place.officialWebsite}
                    className="text-[var(--accent-light)] underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {place.officialWebsite.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            )}
            {official?.officialUrl && (
              <div>
                <dt className="text-xs tracking-[0.14em] text-[var(--text-muted)]">
                  Source link
                </dt>
                <dd className="mt-1">
                  <a
                    href={official.officialUrl}
                    className="text-[var(--accent-light)] underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {official.officialUrl.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            )}
            {place.accessInfo && (
              <Info label="Access" value={place.accessInfo} />
            )}
          </dl>
          {place.amenities && place.amenities.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {place.amenities.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-muted)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>

        {report && (
          <section className="mt-8 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)]/20 p-6">
            <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--accent-light)]">
              MY FIELD REPORT
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Firsthand observations — not official NYS information.
            </p>
            {place.lastPersonallyVerified && (
              <p className="mt-3 text-sm text-[var(--text)]">
                Last personally verified: {place.lastPersonallyVerified}
              </p>
            )}
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {Object.entries({
                "Access difficulty": report.accessDifficulty,
                "Road condition": report.roadCondition,
                "Walk from parking": report.walkFromParking,
                "Site condition": report.siteCondition,
                Privacy: report.privacy,
                Shade: report.shade,
                "Ground condition": report.groundCondition,
                "Water nearby": report.waterNearby,
                "Cell service": report.cellService,
                "Tent suitability": report.tentSuitability,
                "RV suitability": report.rvSuitability,
                Fishing: report.fishingNotes,
                Photography: report.photographyNotes,
                Wildlife: report.wildlifeObserved,
              })
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <Info key={label} label={label} value={value!} />
                ))}
            </dl>
            {report.overallRating && (
              <p className="mt-4 text-sm">Overall rating: {report.overallRating}/5</p>
            )}
            {report.personalNotes && (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                {report.personalNotes}
              </p>
            )}
          </section>
        )}

        {media.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Media</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {media.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={item.url}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  {(item.caption || item.date) && (
                    <figcaption className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {item.caption}
                      {item.date ? ` · ${item.date}` : ""}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {visits.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">My visit history</h2>
            <ol className="mt-4 space-y-3">
              {visits.map((visit) => (
                <li
                  key={visit.id}
                  className="rounded-xl border border-white/10 px-4 py-3"
                >
                  <p className="text-sm font-medium">{visit.date}</p>
                  {visit.weather && (
                    <p className="text-xs text-[var(--text-muted)]">{visit.weather}</p>
                  )}
                  {visit.notes && (
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {visit.notes}
                    </p>
                  )}
                  {visit.activities && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {visit.activities.join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {goals.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Goals</h2>
            <ul className="mt-4 space-y-2">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm"
                >
                  <span>
                    {goal.title}
                    {goal.notes && (
                      <span className="mt-1 block text-xs text-[var(--text-muted)]">
                        {goal.notes}
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      goal.status === "completed"
                        ? "text-[var(--accent-light)]"
                        : "text-[var(--text-muted)]"
                    }
                  >
                    {goal.status === "completed"
                      ? `Done${goal.completedAt ? ` · ${goal.completedAt}` : ""}`
                      : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {campsites.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Campground</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Individual sites — so you can see what a pad actually looks like
              before booking.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-[10px] tracking-[0.16em] text-[var(--text-muted)]">
                  <tr>
                    <th className="py-2 pr-3">Loop</th>
                    <th className="py-2 pr-3">Site</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Tent / RV</th>
                    <th className="py-2 pr-3">Privacy</th>
                    <th className="py-2 pr-3">Shade</th>
                    <th className="py-2 pr-3">Electric</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {campsites.map((site) => (
                    <tr key={site.id} className="border-t border-white/10">
                      <td className="py-3 pr-3">{site.loop ?? "—"}</td>
                      <td className="py-3 pr-3 font-medium">{site.number}</td>
                      <td className="py-3 pr-3">{site.siteType ?? "—"}</td>
                      <td className="py-3 pr-3">
                        {site.tentSuitable ? "Tent" : ""}
                        {site.tentSuitable && site.rvSuitable ? " / " : ""}
                        {site.rvSuitable ? "RV" : ""}
                      </td>
                      <td className="py-3 pr-3">{site.privacy ?? "—"}</td>
                      <td className="py-3 pr-3">{site.shade ?? "—"}</td>
                      <td className="py-3 pr-3">{site.electric ? "Yes" : "No"}</td>
                      <td className="py-3 text-[var(--text-muted)]">
                        {site.notes ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 text-[var(--text)]">{value}</dd>
    </div>
  );
}
