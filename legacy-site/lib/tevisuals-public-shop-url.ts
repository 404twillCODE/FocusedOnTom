/**
 * Public TE Visuals site URLs for outsourcing checkout, downloads, and accounts.
 * Change route shape here if TE Visuals’ marketing site structure changes.
 *
 * Env: `NEXT_PUBLIC_TEVISUALS_PUBLIC_URL` (e.g. https://tevisuals.com — no trailing slash required).
 */

import type { Photo } from "@/lib/photography";

/** True when the browser bundle is built for TE-backed catalog (commerce lives on TE Visuals). */
export function isClientTeVisualsPhotographySource(): boolean {
  return (
    process.env.NEXT_PUBLIC_PHOTOGRAPHY_SOURCE?.trim().toLowerCase() === "tevisuals"
  );
}

export function getTeVisualsPublicUrlRaw(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_TEVISUALS_PUBLIC_URL?.trim();
  return raw?.replace(/\/+$/, "");
}

/**
 * Single portfolio photo page on TE Visuals.
 * Default pattern: `/portfolio/{category}/{gallery}?photo={id}&…`
 */
export type TeVisualsPortfolioShopOptions = {
  /** Open checkout for personal/single license (default). */
  buyPersonal?: boolean;
  /** Open checkout for commercial license. */
  buyCommercial?: boolean;
};

function segmentOrFallback(value: string | undefined, fallback: string): string {
  const s = value?.trim().toLowerCase().replace(/\s+/g, "-") ?? "";
  return s || fallback;
}

/**
 * FocusedOnTom gallery URL slugs / legacy buckets → TE Visuals `/portfolio/{category}/…` segment.
 * TE does not accept FOT display routes like `cars`; public shop links must use TE taxonomy.
 */
const FOCUSEDONTOM_TO_TEVISUALS_PUBLIC_CATEGORY: Record<string, string> = {
  cars: "automotive",
  automotive: "automotive",
  people: "people",
  events: "events",
  nature: "nature",
  landscape: "landscape",
};

function focusedOnTomCategorySlugToTePublicCategory(slug: string): string {
  const key = slug.trim().toLowerCase();
  return FOCUSEDONTOM_TO_TEVISUALS_PUBLIC_CATEGORY[key] ?? key;
}

/**
 * Build the TE Visuals public URL for a photo’s gallery context.
 * Returns `null` if base URL or photo id is missing.
 */
export function buildTeVisualsPortfolioPhotoUrl(
  photo: Photo,
  options: TeVisualsPortfolioShopOptions = {}
): string | null {
  const base = getTeVisualsPublicUrlRaw();
  const id = photo.id?.trim();
  if (!base || !id) return null;

  const categoryRaw = segmentOrFallback(
    photo.categorySlug ?? photo.category,
    "portfolio"
  );
  const category = focusedOnTomCategorySlugToTePublicCategory(categoryRaw);
  const gallery = segmentOrFallback(
    photo.gallerySlug ?? photo.eventSlug ?? photo.galleryId ?? undefined,
    "gallery"
  );

  const path = `/portfolio/${encodeURIComponent(category)}/${encodeURIComponent(gallery)}`;
  const u = new URL(path, base.endsWith("/") ? base : `${base}/`);
  u.searchParams.set("photo", id);

  if (options.buyCommercial) {
    u.searchParams.set("buy", "commercial");
  } else if (options.buyPersonal !== false) {
    u.searchParams.set("buy", "1");
  }

  return u.href;
}

/** Photo page without forcing checkout (e.g. downloads / account handoff on TE). */
export function buildTeVisualsPortfolioPhotoViewUrl(photo: Photo): string | null {
  const base = getTeVisualsPublicUrlRaw();
  const id = photo.id?.trim();
  if (!base || !id) return null;

  const categoryRaw = segmentOrFallback(
    photo.categorySlug ?? photo.category,
    "portfolio"
  );
  const category = focusedOnTomCategorySlugToTePublicCategory(categoryRaw);
  const gallery = segmentOrFallback(
    photo.gallerySlug ?? photo.eventSlug ?? photo.galleryId ?? undefined,
    "gallery"
  );

  const path = `/portfolio/${encodeURIComponent(category)}/${encodeURIComponent(gallery)}`;
  const u = new URL(path, base.endsWith("/") ? base : `${base}/`);
  u.searchParams.set("photo", id);
  return u.href;
}

export function buildTeVisualsAccountUrl(): string | null {
  const base = getTeVisualsPublicUrlRaw();
  if (!base) return null;
  const u = new URL("/account", base.endsWith("/") ? base : `${base}/`);
  return u.href;
}

/** FOT interstitial that validates `target` is under `NEXT_PUBLIC_TEVISUALS_PUBLIC_URL`. */
export function buildPhotographyBuyRedirectUrl(targetTeUrl: string): string {
  return `/photography/buy/redirect?target=${encodeURIComponent(targetTeUrl)}`;
}

/**
 * True if `target` is same origin as configured TE public site (open redirect guard).
 */
export function isTeVisualsPublicTargetAllowed(target: string): boolean {
  const base = getTeVisualsPublicUrlRaw();
  if (!base) return false;
  try {
    const t = new URL(target);
    const b = new URL(base.endsWith("/") ? base : `${base}/`);
    return t.origin === b.origin;
  } catch {
    return false;
  }
}
