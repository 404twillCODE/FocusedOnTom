import { getImageProps } from "next/image";
import type { Photo } from "@/lib/photography";

/** Matches the lightbox: ~viewport width. */
export const LIGHTBOX_SIZES = "92vw";

/** Full-quality layer in the lightbox (user-visible final). */
export const LIGHTBOX_QUALITY_FULL = 75;

/** Fast placeholder under the full layer until it finishes loading. */
export const LIGHTBOX_QUALITY_LOW = 22;

function lightboxGetImageProps(photo: Photo, quality: number) {
  return getImageProps({
    src: photo.src,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    sizes: LIGHTBOX_SIZES,
    quality,
  }).props;
}

/**
 * Warm the browser cache for the same optimized URL the lightbox will request.
 * Safe to call from pointerenter / touchstart; duplicates are harmless.
 */
export function prefetchLightboxImage(photo: Photo) {
  if (typeof window === "undefined") return;
  const props = lightboxGetImageProps(photo, LIGHTBOX_QUALITY_FULL);
  const img = new Image();
  img.src = props.src;
  if (props.srcSet) {
    img.setAttribute("srcset", props.srcSet);
    if (props.sizes) img.setAttribute("sizes", props.sizes);
  }
}

export function prefetchLightboxNeighbors(
  photos: Photo[],
  index: number | null
) {
  if (index === null || photos.length === 0) return;
  const n = photos.length;
  const unique = new Set<number>([
    index,
    (index + 1) % n,
    (index - 1 + n) % n,
  ]);
  for (const i of unique) {
    prefetchLightboxImage(photos[i]);
  }
}
