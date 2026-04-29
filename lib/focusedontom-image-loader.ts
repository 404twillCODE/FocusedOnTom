import type { ImageLoaderProps } from "next/image";

/**
 * Custom Next image loader: serve CDN/R2 URLs (and other remotes) directly.
 *
 * Default `/_next/image` re-fetches every remote file through the dev server
 * with a short upstream timeout — large WebP from R2 often hits
 * "upstream image response timed out" even when the object exists. Our
 * bucket already stores optimized WebP, so skipping the optimizer avoids that
 * failure mode; the browser loads the CDN URL like a normal img tag.
 */
export default function focusedontomImageLoader({
  src,
}: ImageLoaderProps): string {
  if (typeof src !== "string") {
    if (src && typeof src === "object" && "src" in src) {
      return String((src as { src: string }).src);
    }
    return "";
  }
  if (src.startsWith("/")) {
    return src;
  }
  if (src.startsWith("https://") || src.startsWith("http://")) {
    return src;
  }
  return src;
}
