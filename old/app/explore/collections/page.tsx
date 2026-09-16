import type { Metadata } from "next";
import Link from "next/link";
import { collectionProgress, getCollections } from "@/lib/explore/data";

export const metadata: Metadata = {
  title: "Collections",
  description: "Long-term exploration challenges across New York.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await getCollections();
  const cards = await Promise.all(
    collections.map(async (collection) => ({
      collection,
      progress: await collectionProgress(collection.id),
    }))
  );

  return (
    <section className="pb-24 pt-8 sm:pt-10">
      <div className="container-page">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          EXPLORE NEW YORK
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Collections
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
          Challenges and lists. Places are shared — they are not copied into
          each collection.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.map(({ collection, progress }) => (
            <li key={collection.id}>
              <Link
                href={`/explore/collections/${collection.slug}`}
                className="block rounded-2xl border border-white/10 bg-[var(--bg3)]/40 p-6 hover:border-white/20"
              >
                <h2 className="text-xl font-medium">{collection.title}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {collection.description}
                </p>
                <p className="mt-4 text-sm">
                  {progress.completed} / {progress.total} explored
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {progress.total} locations
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
