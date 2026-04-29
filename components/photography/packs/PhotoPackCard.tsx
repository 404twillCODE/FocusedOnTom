import Image from "next/image";
import type { PhotoPackCard as PhotoPackCardType } from "@/lib/photo-packs";
import { cn } from "@/lib/cn";
import { RarityBadge } from "@/components/photography/packs/RarityBadge";

const rarityGlows: Record<PhotoPackCardType["rarity"], string> = {
  Standard: "shadow-[0_18px_50px_-26px_rgba(255,255,255,0.45)]",
  Rare: "shadow-[0_20px_60px_-24px_rgba(34,211,238,0.45)]",
  Epic: "shadow-[0_22px_66px_-24px_rgba(139,92,246,0.5)]",
  Signature: "shadow-[0_24px_74px_-22px_rgba(251,191,36,0.65)]",
};

export function PhotoPackCard({
  card,
  className,
}: {
  card: PhotoPackCardType;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl",
        rarityGlows[card.rarity],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute inset-y-0 -left-1/2 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-md transition-transform duration-1000 group-hover:translate-x-[280%]" />
      </div>

      <div className="relative aspect-[4/5] overflow-hidden border-b border-white/10">
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <RarityBadge rarity={card.rarity} />
        </div>
      </div>

      <div className="space-y-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
            {card.title}
          </h3>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/70">
            {card.category}
          </span>
        </div>
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/75">
          {card.series} · {card.cardNumber}
        </p>
        <p className="text-sm text-white/70">{card.description}</p>
      </div>
    </article>
  );
}
