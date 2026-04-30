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
      "Full-quality original download",
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

/** Baseline ~2hr car session (stills-first); add-ons below stack for rollers / short-form. */
export const AUTOMOTIVE_BASE_SESSION_CENTS = 25000;

export const SESSION_TYPES: SessionType[] = [
  {
    id: "automotive",
    label: "Car photography",
    description:
      "Static hero shots, rolling shots, and/or short-form content — up to about 2 hours on location. Deposit holds your spot while we align on scope; if I’m not a fit, the deposit is refunded in full.",
    depositCents: 10000,
    durationMin: 120,
  },
  {
    id: "special_request",
    label: "Special request (non-car)",
    description:
      "Portraits, events, or anything outside the usual car workflow. Tell me what you have in mind — I’ll confirm feasibility and pricing before the shoot. If I’m not a fit, your deposit is refunded in full.",
    depositCents: 10000,
    durationMin: 120,
  },
];

/** Shown in the booking UI and appended to booking notes for your records. */
export const BOOKING_POLICY = {
  depositRefundIfDeclined:
    "Full deposit refund if I don’t take the job.",
  preferredDateFlexible:
    "Preferred date and time stay flexible until we agree on a slot.",
  basePricingFlex:
    "Guide prices can go up for concept, song or music licensing, travel, or extra scope.",
} as const;

/**
 * Car session deliverables. `addonCents` stacks on {@link AUTOMOTIVE_BASE_SESSION_CENTS}
 * (still-only baseline). Guide only — final quote after scope / location / music.
 */
export const CAR_DELIVERABLES = [
  {
    id: "static_photos",
    label: "Static photos",
    description:
      "Hero angles, details, location stills — classic car feature shots.",
    addonCents: 0,
  },
  {
    id: "rollers",
    label: "Rolling shots",
    description:
      "Photo rollers and video rollers from a safe chase setup or agreed roll route. Concept, pacing, and song choice (and any licensed music) can push the final quote above the base.",
    addonCents: 35000,
  },
  {
    id: "tiktok_shortform",
    label: "TikTok / short-form",
    description:
      "Vertical clips for Reels, TikTok, and similar — concept and song choice affect editing and licensing, so the quote can run above the base.",
    addonCents: 25000,
  },
] as const;

export type CarDeliverableId = (typeof CAR_DELIVERABLES)[number]["id"];

const CAR_DELIVERABLE_IDS = new Set<string>(
  CAR_DELIVERABLES.map((d) => d.id)
);

export function isCarDeliverableId(id: string): boolean {
  return CAR_DELIVERABLE_IDS.has(id);
}

export function labelsForDeliverableIds(ids: string[]): string[] {
  return ids
    .filter((id) => CAR_DELIVERABLE_IDS.has(id))
    .map(
      (id) => CAR_DELIVERABLES.find((d) => d.id === id)?.label ?? id
    );
}

export function normalizeCarDeliverableIds(ids: unknown[]): string[] {
  return [
    ...new Set(
      ids.filter(
        (id): id is string => typeof id === "string" && CAR_DELIVERABLE_IDS.has(id)
      ),
    ),
  ];
}

/** Guide session subtotal from selected deliverables (base + add-ons). */
export function estimateAutomotiveSessionCents(deliverableIds: string[]): number {
  const normalized = normalizeCarDeliverableIds(deliverableIds);
  const addOns = normalized.reduce((sum, id) => {
    const row = CAR_DELIVERABLES.find((d) => d.id === id);
    return sum + (row?.addonCents ?? 0);
  }, 0);
  return AUTOMOTIVE_BASE_SESSION_CENTS + addOns;
}

export function composeBookingNotes(options: {
  sessionTypeId: string;
  deliverableIds: string[];
  clientNotes: string;
  /** Car sessions: guide subtotal sent to the photographer. */
  estimatedSessionCents?: number | null;
}): string {
  const parts: string[] = [];
  if (options.sessionTypeId === "automotive" && options.deliverableIds.length > 0) {
    const labels = labelsForDeliverableIds(options.deliverableIds);
    if (labels.length) {
      parts.push(`Deliverables requested: ${labels.join(", ")}`);
    }
  }
  if (
    options.sessionTypeId === "automotive" &&
    options.estimatedSessionCents != null &&
    options.estimatedSessionCents > 0
  ) {
    parts.push(
      `Guide session subtotal (base; travel / rush / music licensing may add): ${formatCents(options.estimatedSessionCents)}`
    );
  }
  const trimmed = options.clientNotes.trim();
  if (trimmed) parts.push(trimmed);
  if (options.sessionTypeId === "automotive") {
    parts.push(
      [
        "Policies (booking flow):",
        BOOKING_POLICY.depositRefundIfDeclined,
        BOOKING_POLICY.preferredDateFlexible,
        BOOKING_POLICY.basePricingFlex,
      ].join(" ")
    );
  } else if (options.sessionTypeId === "special_request") {
    parts.push(
      [
        "Policies (booking flow):",
        BOOKING_POLICY.depositRefundIfDeclined,
        BOOKING_POLICY.preferredDateFlexible,
      ].join(" ")
    );
  }
  return parts.join("\n\n");
}

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
