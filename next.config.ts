import type { NextConfig } from "next";

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

  const raw =
    process.env.NEXT_PUBLIC_CDN_URL ??
    process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (raw) {
    try {
      const url = new URL(raw);
      patterns.unshift({
        protocol: url.protocol.replace(":", "") as "https" | "http",
        hostname: url.hostname,
      });
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
