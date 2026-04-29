import type { NextConfig } from "next";

/** Production CDN; always allow so dev/build work even if env is unset. */
const DEFAULT_PHOTO_CDN_HOSTNAMES = ["cdn.focusedontom.com"] as const;

/**
 * Allow <Image src="..."> to load from the Cloudflare R2 CDN the photography
 * script uploads to. The hostname is derived from NEXT_PUBLIC_CDN_URL if set,
 * otherwise we fall back to permissive patterns for standard R2 hosts.
 */
function getRemoteImagePatterns() {
  const patterns: Array<{
    protocol: "https" | "http";
    hostname: string;
    pathname?: string;
  }> = [
    { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    { protocol: "https", hostname: "*.r2.dev" },
  ];

  const seen = new Set(patterns.map((p) => p.hostname.toLowerCase()));

  for (const hostname of DEFAULT_PHOTO_CDN_HOSTNAMES) {
    const key = hostname.toLowerCase();
    if (!seen.has(key)) {
      patterns.unshift({ protocol: "https", hostname });
      seen.add(key);
    }
  }

  const raw =
    process.env.NEXT_PUBLIC_CDN_URL ??
    process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (raw) {
    try {
      const url = new URL(raw);
      const hostKey = url.hostname.toLowerCase();
      if (!seen.has(hostKey)) {
        patterns.unshift({
          protocol: url.protocol.replace(":", "") as "https" | "http",
          hostname: url.hostname,
        });
        seen.add(hostKey);
      }
    } catch {
      // ignore — bad URL
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: getRemoteImagePatterns(),
    /**
     * Skip Vercel Image Optimization (transformations + cache writes count
     * against the hobby plan). R2/CDN files are already WebP; local assets
     * are small — browsers load src URLs directly.
     */
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
