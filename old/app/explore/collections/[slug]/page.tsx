import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  collectionProgress,
  getCollectionBySlug,
  getPlacesForCollection,
} from "@/lib/explore/data";
import { StatusBadge } from "@/components/explore/StatusBadge";
import { PLACE_TYPE_LABELS } from "@/lib/explore/types";
import { CollectionMap } from "@/components/explore/dynamic-maps";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  return {
    title: collection?.title ?? "Collection",
    description: collection?.description,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const places = await getPlacesForCollection(collection.id);
  const progress = await collectionProgress(collection.id);

  return (
    <article className="pb-24 pt-8 sm:pt-10">
      <div className="container-page max-w-5xl">
        <p className="text-[11px] tracking-[0.22em] text-[var(--text-muted)]">
          <Link href="/explore/collections" className="hover:text-[var(--text)]">
            COLLECTIONS
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          {collection.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
          {collection.description}
        </p>
        <p className="mt-4 text-lg">
          {progress.completed} / {progress.total} explored
        </p>
        <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="mt-8 h-[320px] overflow-hidden rounded-2xl border border-white/10">
          <CollectionMap places={places} />
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {places.map((place) => (
            <li key={place.id}>
              <Link
                href={`/explore/places/${place.slug}`}
                className="block rounded-xl border border-white/10 px-4 py-3 hover:border-white/20"
              >
                <StatusBadge status={place.personalStatus} />
                <p className="mt-2 font-medium">{place.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {PLACE_TYPE_LABELS[place.type]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
