import { PHOTO_BRAND } from "@/lib/photography-config";

/**
 * Canonical public site origin.
 * - Production / preview: NEXT_PUBLIC_SITE_URL, else PHOTO_BRAND.siteUrl.
 * - Local dev: http://localhost:3000 so OG tags and metadata stay local.
 */
export function getSiteUrl(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const normalized = fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv;
    return new URL(normalized);
  }
  if (process.env.NODE_ENV === "development") {
    return new URL("http://localhost:3000");
  }
  const raw = PHOTO_BRAND.siteUrl.endsWith("/")
    ? PHOTO_BRAND.siteUrl.slice(0, -1)
    : PHOTO_BRAND.siteUrl;
  return new URL(raw);
}

/** Absolute URL for a path like `/photography` or full URL passthrough. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(path, getSiteUrl()).toString();
}
