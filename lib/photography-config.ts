// ---------------------------------------------------------------------------
// Central config for the photography premium platform.
// Edit pricing, copy, print options, and session types here.
// ---------------------------------------------------------------------------

import type {
  LicenseTier,
  PrintProduct,
  SessionType,
} from "./photography-types";

export const PHOTO_BRAND = {
  /** Shown in the lightbox watermark. */
  watermarkText: "FOCUSEDONTOM",
  /** "Request a print/buy manually" falls back to this address. */
  contactEmail: "hello@focusedontom.com",
  siteUrl: "https://focusedontom.com",
};

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: "personal",
    name: "Personal",
    priceCents: 500,
    tagline: "High-res download for personal use",
    details: [
      "3000px JPG/WebP original",
      "Personal wallpaper, social, prints for yourself",
      "No resale, no commercial use",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_PERSONAL",
  },
  {
    id: "commercial",
    name: "Commercial",
    priceCents: 5000,
    tagline: "For business, brand, or editorial use",
    details: [
      "Full-resolution original",
      "Use on websites, ads, editorial, merch",
      "Royalty-free, single project",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_COMMERCIAL",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceCents: 1500,
    subscription: true,
    tagline: "Watermark-free browsing + unlimited downloads",
    details: [
      "Browse everything without watermarks",
      "Unlimited personal downloads while active",
      "Cancel anytime from your account",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_UNLIMITED_MONTHLY",
  },
];

export function getLicense(id: string): LicenseTier | undefined {
  return LICENSE_TIERS.find((t) => t.id === id);
}

export const PRINT_PRODUCT: PrintProduct = {
  sizes: [
    { id: "8x10", label: "8 x 10 in", widthIn: 8, heightIn: 10, priceCents: 3500 },
    { id: "12x18", label: "12 x 18 in", widthIn: 12, heightIn: 18, priceCents: 6500 },
    { id: "16x24", label: "16 x 24 in", widthIn: 16, heightIn: 24, priceCents: 9500 },
    { id: "24x36", label: "24 x 36 in", widthIn: 24, heightIn: 36, priceCents: 14500 },
  ],
  papers: [
    { id: "lustre", label: "Lustre", priceDeltaCents: 0 },
    { id: "matte", label: "Matte", priceDeltaCents: 500 },
    { id: "metal", label: "Metal", priceDeltaCents: 3500 },
  ],
};

export const SESSION_TYPES: SessionType[] = [
  {
    id: "portrait",
    label: "Portrait session",
    description: "60 minutes, up to 3 outfit changes, 20 edited images delivered.",
    depositCents: 5000,
    durationMin: 60,
  },
  {
    id: "event",
    label: "Event coverage",
    description: "Up to 3 hours of candid event coverage, 80 edited images.",
    depositCents: 15000,
    durationMin: 180,
  },
  {
    id: "automotive",
    label: "Automotive / rolling shots",
    description: "Car feature or rolling shots, up to 2 hours on location.",
    depositCents: 10000,
    durationMin: 120,
  },
];

export function getSessionType(id: string): SessionType | undefined {
  return SESSION_TYPES.find((s) => s.id === id);
}

/** Hard cap on how many favorites a client can submit in one proofing round. */
export const PRIVATE_GALLERY_FAVORITES_LIMIT = 200;

/** How long a signed private-gallery cookie is valid. */
export const PRIVATE_GALLERY_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

/** How long a signed download token is valid after purchase. */
export const DOWNLOAD_TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** Maximum number of times a single download token can be used. */
export const DOWNLOAD_TOKEN_MAX_USES = 5;

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) return `$${dollars}`;
  return `$${dollars.toFixed(2)}`;
}
