import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireExploreAdmin } from "@/lib/explore/auth";
import {
  getFieldReport,
  getGoalsForPlace,
  getPlaceById,
  getVisitsForPlace,
} from "@/lib/explore/data";
import { addGoal, addVisit, hidePlace, upsertFieldReport } from "../../actions";
import { PLACE_TYPE_LABELS } from "@/lib/explore/types";
import { StatusBadge } from "@/components/explore/StatusBadge";

type Props = { params: Promise<{ id: string }> };

export default async function AdminPlacePage({ params }: Props) {
  const user = await requireExploreAdmin();
  if (!user) redirect("/explore/admin/login");
  const { id } = await params;
  const place = await getPlaceById(id, { includeHidden: true });
  if (!place) notFound();
  const official = place.officialPlaceData;
  const visits = await getVisitsForPlace(place.id);
  const report = await getFieldReport(place.id);
  const goals = await getGoalsForPlace(place.id);
  const sourceUrl =
    official?.officialUrl ||
    place.officialWebsite ||
    place.officialSource?.sourceUrl;

  return (
    <article className="pb-24 pt-8">
      <div className="container-page max-w-3xl">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          <Link href="/explore/admin">ADMIN</Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{place.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {PLACE_TYPE_LABELS[place.type]} · {place.slug}
        </p>
        <div className="mt-3">
          <StatusBadge status={place.personalStatus} />
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 p-5">
          <p className="text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
            OFFICIAL / SOURCE
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Source</dt>
              <dd>{place.officialSource?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Record ID</dt>
              <dd>{place.officialSourceRecordId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Facility</dt>
              <dd>{official?.facility ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Asset</dt>
              <dd>{official?.asset ?? official?.officialType ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Last import</dt>
              <dd>{official?.lastImportedAt?.slice(0, 16) ?? "—"}</dd>
            </div>
          </dl>
          {sourceUrl && (
            <a
              href={sourceUrl}
              className="mt-3 inline-block text-sm text-[var(--accent-light)]"
              target="_blank"
              rel="noreferrer"
            >
              Open official source
            </a>
          )}
          {official?.rawProperties && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-black/30 p-3 text-[11px] text-[var(--text-muted)]">
              {JSON.stringify(official.rawProperties, null, 2)}
            </pre>
          )}
        </section>

        <form action={hidePlace.bind(null, place.id, !place.isHidden)} className="mt-4">
          <button
            type="submit"
            className="rounded-full border border-white/10 px-4 py-2 text-xs tracking-[0.14em]"
          >
            {place.isHidden ? "UNHIDE PLACE" : "HIDE PLACE"}
          </button>
        </form>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Add visit</h2>
          <form action={addVisit} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="placeId" value={place.id} />
            <input
              type="date"
              name="visitedAt"
              required
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="weather"
              placeholder="Weather"
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="activities"
              placeholder="Activities (comma separated)"
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm sm:col-span-2"
            />
            <textarea
              name="notes"
              placeholder="Notes"
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm sm:col-span-2"
            />
            <button className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs tracking-[0.16em] text-[var(--accent-light)]">
              SAVE VISIT
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {visits.map((v) => (
              <li key={v.id} className="rounded-xl border border-white/10 px-3 py-2">
                {v.date} {v.notes ? `— ${v.notes}` : ""}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Field report</h2>
          <form action={upsertFieldReport} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="placeId" value={place.id} />
            {[
              ["accessDifficulty", "Access difficulty", report?.accessDifficulty],
              ["roadCondition", "Road condition", report?.roadCondition],
              ["walkFromVehicle", "Walk from vehicle", report?.walkFromParking],
              ["siteCondition", "Site condition", report?.siteCondition],
              ["privacy", "Privacy", report?.privacy],
              ["shade", "Shade", report?.shade],
              ["cellService", "Cell service", report?.cellService],
              ["tentSuitability", "Tent suitability", report?.tentSuitability],
            ].map(([name, label, value]) => (
              <label key={name} className="text-xs text-[var(--text-muted)]">
                {label}
                <input
                  name={name}
                  defaultValue={value ?? ""}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
            ))}
            <textarea
              name="generalNotes"
              defaultValue={report?.personalNotes ?? ""}
              placeholder="Personal notes"
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm sm:col-span-2"
            />
            <button className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs tracking-[0.16em] text-[var(--accent-light)]">
              SAVE REPORT
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Goals</h2>
          <form action={addGoal} className="mt-3 flex gap-2">
            <input type="hidden" name="placeId" value={place.id} />
            <input
              name="title"
              placeholder="Photograph sunset…"
              className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm"
            />
            <button className="rounded-full border border-white/10 px-4 text-xs tracking-[0.14em]">
              ADD
            </button>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {goals.map((g) => (
              <li key={g.id} className="rounded-xl border border-white/10 px-3 py-2">
                {g.title} · {g.status}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10">
          <Link href={`/explore/places/${place.slug}`} className="text-sm text-[var(--accent-light)]">
            View public place page →
          </Link>
        </p>
      </div>
    </article>
  );
}
