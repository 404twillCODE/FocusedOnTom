"use client";

import type { PhotoPackCard } from "@/lib/photo-packs";
import { PhotoPackCard as CardView } from "@/components/photography/packs/PhotoPackCard";
import { LockedCard } from "@/components/photography/packs/LockedCard";

export function CollectionGrid({
  cards,
  ownedIds,
  duplicateCounts,
}: {
  cards: PhotoPackCard[];
  ownedIds: Set<string>;
  duplicateCounts: Record<string, number>;
}) {
  const sortedCards = [...cards].sort((a, b) =>
    a.cardNumber.localeCompare(b.cardNumber)
  );

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sortedCards.map((card) => {
        const owned = ownedIds.has(card.id);
        if (!owned) return <LockedCard key={card.id} />;

        const duplicates = duplicateCounts[card.id] ?? 0;
        return (
          <div key={card.id} className="space-y-2">
            <CardView card={card} />
            {duplicates > 0 ? (
              <p className="text-center text-xs uppercase tracking-[0.16em] text-amber-200/80">
                Duplicate pulls: {duplicates}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
