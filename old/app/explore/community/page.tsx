import type { Metadata } from "next";
import Link from "next/link";
import { getCommunitySubmissions, getPlaceById } from "@/lib/explore/data";

export const metadata: Metadata = {
  title: "Community",
  description: "Field reports from other explorers — always labeled, always moderated.",
};

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const submissions = (await getCommunitySubmissions()).filter(
    (s) => s.status === "approved"
  );
  const items = await Promise.all(
    submissions.map(async (item) => ({
      item,
      place: item.placeId ? await getPlaceById(item.placeId) : undefined,
    }))
  );

  return (
    <section className="pb-24 pt-8 sm:pt-10">
      <div className="container-page max-w-3xl">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          EXPLORE NEW YORK
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Community
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-muted)]">
          Neighbors will eventually be able to send photos, road and trail
          conditions, campsite notes, and corrections. Nothing is published
          automatically — every report waits for review.
        </p>
        <p className="mt-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-[var(--text-muted)]">
          Community content is never official NYS DEC or State Parks
          information. Approved reports will always show a username, dates, and
          a community label.
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No public community reports yet. The pipeline is ready: pending
              → approved / rejected.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-block text-xs tracking-[0.16em] text-[var(--accent-light)]"
            >
              BACK TO THE MAP →
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {items.map(({ item, place }) => {
              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-white/10 p-5"
                >
                  <p className="text-[10px] tracking-[0.18em] text-[var(--accent-light)]">
                    COMMUNITY CONTENT
                  </p>
                  <p className="mt-2 text-sm">
                    {item.username} · submitted {item.submittedAt.slice(0, 10)}
                    {item.visitDate ? ` · visited ${item.visitDate}` : ""}
                  </p>
                  {place && (
                    <Link
                      href={`/explore/places/${place.slug}`}
                      className="mt-1 block text-sm text-[var(--accent-light)]"
                    >
                      {place.name}
                    </Link>
                  )}
                  <p className="mt-3 text-sm text-[var(--text-muted)]">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
