"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { photoPackCards } from "@/src/data/photo-pack-cards";
import { getPhotoPackCollection } from "@/lib/photo-packs";
import { CollectionGrid } from "@/components/photography/packs/CollectionGrid";
import { Button } from "@/components/ui/button";

export default function PhotographyCollectionPage() {
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [duplicateCounts, setDuplicateCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const collection = getPhotoPackCollection();
    setOwnedIds(new Set(collection.pulledCardIds));
    setDuplicateCounts(collection.duplicateCounts);
  }, []);

  const eligibleCards = useMemo(
    () => photoPackCards.filter((card) => card.isPackEligible),
    []
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0d1d35_0%,#040a12_55%,#05070d_100%)]">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-10 sm:px-6 sm:pt-28">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Photo Packs</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Your Collection
        </h1>
        <p className="mt-3 text-white/70">
          Track every unlocked premium poster card. Unrevealed cards stay hidden until you pull them.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-white/70">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            {ownedIds.size}/{eligibleCards.length} unlocked
          </span>
        </div>
        <div className="mt-6">
          <Button asChild className="border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:border-cyan-200/70">
            <Link href="/photography/packs/open">Open Pack</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <CollectionGrid
          cards={eligibleCards}
          ownedIds={ownedIds}
          duplicateCounts={duplicateCounts}
        />
      </section>
    </main>
  );
}
