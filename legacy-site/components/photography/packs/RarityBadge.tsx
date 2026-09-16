import { cn } from "@/lib/cn";
import type { PhotoPackRarity } from "@/lib/photo-packs";

const rarityStyles: Record<PhotoPackRarity, string> = {
  Standard:
    "border-white/20 bg-white/10 text-white/85 shadow-[0_0_22px_rgba(255,255,255,0.16)]",
  Rare: "border-cyan-300/45 bg-cyan-400/15 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.32)]",
  Epic: "border-violet-300/50 bg-violet-400/15 text-violet-100 shadow-[0_0_30px_rgba(167,139,250,0.36)]",
  Signature:
    "border-amber-300/60 bg-amber-400/20 text-amber-100 shadow-[0_0_36px_rgba(251,191,36,0.45)]",
};

export function RarityBadge({ rarity, className }: { rarity: PhotoPackRarity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase",
        rarityStyles[rarity],
        className
      )}
    >
      {rarity}
    </span>
  );
}
