/**
 * Environment / config.
 * NEXT_PUBLIC_* are inlined at build time.
 */

export const env = {
  public: {
    /** "development" = show holding page to public; "live" = full site. Default development. */
    siteMode: process.env.NEXT_PUBLIC_SITE_MODE ?? "development",
  },
} as const;
