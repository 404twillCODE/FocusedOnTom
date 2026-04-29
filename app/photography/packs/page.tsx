import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Star } from "lucide-react";
import { photoPackCards } from "@/src/data/photo-pack-cards";
import { PHOTO_PACK_RARITY_WEIGHTS } from "@/lib/photo-packs";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/photography/packs/RarityBadge";

export const metadata: Metadata = {
  title: "Photo Packs | Focused on Tom",
  description: "Open mystery packs and collect exclusive premium poster drops.",
};

const rarityList = Object.entries(PHOTO_PACK_RARITY_WEIGHTS) as Array<
  [keyof typeof PHOTO_PACK_RARITY_WEIGHTS, number]
>;

export default function PhotoPacksPage() {
  const eligibleCount = photoPackCards.filter((card) => card.isPackEligible).length;
  const exclusiveCount = photoPackCards.filter((card) => card.isExclusive).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0d1d35_0%,#040a12_48%,#04070f_100%)]">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-14 sm:px-6 sm:pt-28">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Photo Packs</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Open a Photo Pack
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Collect exclusive photo cards and premium poster drops.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-white/70">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
              {eligibleCount} Pack Eligible Cards
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
              {exclusiveCount} Exclusive Pulls
            </span>
          </div>
          <div className="mt-7">
            <Button asChild className="border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:border-cyan-200/70">
              <Link href="/photography/packs/open">Open Pack</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pb-10 sm:px-6 md:grid-cols-2">
        {[
          {
            title: "Starter Drop",
            subtitle: "1 random collectible card",
            detail: "Built for quick reveals and daily collection progress.",
            icon: Sparkles,
          },
          {
            title: "Curated Premium Set",
            subtitle: "Only manually marked pack-eligible photos",
            detail: "Pack pulls never include the full public gallery by default.",
            icon: Star,
          },
        ].map((pack) => (
          <article
            key={pack.title}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
          >
            <pack.icon className="h-5 w-5 text-cyan-200/85" />
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{pack.title}</h2>
            <p className="mt-1 text-sm text-cyan-100/80">{pack.subtitle}</p>
            <p className="mt-3 text-sm text-white/70">{pack.detail}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-white">Rarity Tiers</h2>
          <p className="mt-2 text-sm text-white/70">
            Pull chances prioritize common cards while preserving premium surprise moments.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rarityList.map(([rarity, weight]) => (
              <div
                key={rarity}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <RarityBadge rarity={rarity} />
                <span className="text-sm font-medium text-white/80">{weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
