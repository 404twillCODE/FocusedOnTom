"use client";

import { PHOTO_BRAND } from "@/lib/photography-config";

/**
 * Subtle, non-intrusive watermark overlay used inside the Lightbox.
 * Renders a tiled diagonal repeat of the brand mark over the image.
 *
 * Purely decorative / deterrent — it does not stop a determined screenshot,
 * but it makes the "Buy for $5" or "Unlimited" offer feel concretely better.
 * Hidden for Unlimited subscribers and for photos the current user has
 * already purchased (the parent passes `hidden` in those cases).
 */
export function PhotoWatermark({
  hidden = false,
  text = PHOTO_BRAND.watermarkText,
}: {
  hidden?: boolean;
  text?: string;
}) {
  if (hidden) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden rounded-lg"
      style={{
        // Tiled diagonal wordmark with low opacity and overlay blend so it
        // reads clearly on dark and light areas.
        backgroundImage: `repeating-linear-gradient(
          -28deg,
          transparent 0,
          transparent 140px,
          rgba(255,255,255,0.0) 140px,
          rgba(255,255,255,0.0) 141px
        )`,
      }}
    >
      <div
        className="absolute inset-0 flex flex-wrap content-start gap-x-24 gap-y-24 p-10"
        style={{ transform: "rotate(-22deg) scale(1.4)", transformOrigin: "center" }}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/20 sm:text-sm"
            style={{ mixBlendMode: "overlay" }}
          >
            {text} · {text}
          </span>
        ))}
      </div>
    </div>
  );
}
