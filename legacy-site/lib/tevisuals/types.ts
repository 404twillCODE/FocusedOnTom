// ---------------------------------------------------------------------------
// Typed contract for the TE Visuals public API that FocusedOnTom consumes.
//
// TE Visuals is the source of truth for photography (galleries, originals,
// licensing, downloads). FocusedOnTom only DISPLAYS Tom-attributed public
// photos and forwards purchases / downloads to TE Visuals.
//
// These types are the contract — TE Visuals must serve responses that match
// this shape. The client in `./client.ts` validates defensively at runtime so
// missing or extra fields don't crash the site.
// ---------------------------------------------------------------------------

/** Per-photo attribution. Anything other than `"tom"` is filtered OUT. */
export type TeVisualsPhotographer = "tom" | "eric" | "team";

/** Public-facing license tiers FocusedOnTom shows on its photography pages. */
export type TeVisualsLicenseId = "personal" | "commercial" | "unlimited";

export type TeVisualsExif = {
  camera?: string | null;
  lens?: string | null;
  iso?: number | string | null;
  focalLength?: string | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
};

export type TeVisualsCatalogPhoto = {
  /** Stable photo id assigned by TE Visuals. */
  id: string;
  photoId?: string | null;
  galleryId?: string | null;
  galleryTitle?: string | null;
  gallerySlug?: string | null;
  category?: string | null;
  /** Human filename for download disposition. */
  filename: string;
  /** Owner. FocusedOnTom only displays `"tom"`. */
  photographer: TeVisualsPhotographer;
  /** Optimized public preview URL (signed or CDN). Safe to <Image src>. */
  src: string;
  /** Optional secondary preview at a different size, if TE Visuals exposes one. */
  thumbSrc?: string | null;
  publicUrl?: string | null;
  proxyUrl?: string | null;
  width: number;
  height: number;
  /** Caption like "Sony A6400 · 28mm · f/2.8 · 1/1600s · ISO 100". */
  techCaption?: string | null;
  /** ISO timestamp of the EXIF DateTimeOriginal when present. */
  capturedAt?: string | null;
  /** ISO timestamp of row create time in TE Visuals DB. */
  createdAt?: string | null;
  /** Explicit photo order within a gallery when present. */
  sortOrder?: number | null;
  /** Canonical TE Visuals display order (highest priority when present). */
  displayOrder?: number | null;
  /** Cursor/order token from sync feed (for deterministic tie-breaks). */
  cursor?: string | null;
  exif?: TeVisualsExif | null;
  /** Optional sub-folder slug within the gallery (e.g. "day-1"). */
  sectionSlug?: string | null;
  sectionId?: string | null;
  sectionTitle?: string | null;
  sectionOrder?: number | null;
  photoOrderWithinSection?: number | null;
  /** Optional per-photo override of price; otherwise gallery / global price applies. */
  priceCents?: number | null;
  personalPriceCents?: number | null;
  commercialPriceCents?: number | null;
  currency?: string | null;
  prices?: {
    personalCents?: number | null;
    commercialCents?: number | null;
    currency?: string | null;
  } | null;
  watermarkRequired?: boolean | null;
  isForSale?: boolean | null;
};

export type TeVisualsCatalogGallery = {
  id: string;
  slug: string;
  /** TE Visuals category — automotive | portraits | weddings | sports | …  */
  category: string;
  /** "public" only ever returned to FocusedOnTom. Defensive. */
  visibility: "public" | "private";
  title: string;
  description?: string | null;
  /** Gallery-level cover photo id (otherwise first photo). */
  coverPhotoId?: string | null;
  /** ISO timestamp; gallery created. */
  createdAt?: string | null;
  /** Optional explicit gallery date from TE Visuals. */
  date?: string | null;
  /** Photos in display order. Already filtered to public; FOT filters again to tom. */
  photos: TeVisualsCatalogPhoto[];
};

export type TeVisualsCatalogResponse = {
  generatedAt: string;
  baseUrl: string;
  galleries: TeVisualsCatalogGallery[];
};

// ---------------------------------------------------------------------------
// Checkout & download contract (forwarders).
// ---------------------------------------------------------------------------

/**
 * Server-to-server FocusedOnTom checkout on TE Visuals
 * (`POST /api/sync/focused-on-tom/checkout`).
 *
 * `TEVISUALS_API_KEY` on FOT must equal `FOT_SYNC_API_KEY` on TE Visuals.
 */
export type TeVisualsSyncCheckoutInput = {
  photoId: string;
  license: Extract<TeVisualsLicenseId, "personal" | "commercial">;
  /** Same-origin URL (e.g. current gallery/lightbox page) for success/cancel. */
  returnUrl: string;
  /** Used to provision/link the buyer in TE Visuals before Stripe Checkout. */
  buyerEmail: string;
};

export type TeVisualsCheckoutResponse =
  | { ok: true; url: string }
  | { ok: false; error: string; status?: number };

/**
 * Server-to-server entitlement check (`POST /api/sync/focused-on-tom/entitlement`).
 * TE Visuals is source of truth for purchases when checkout runs there; FOT Supabase
 * rows may not exist. Same auth as checkout (`TEVISUALS_API_KEY` ↔ `FOT_SYNC_API_KEY`).
 */
export type TeVisualsSyncEntitlementInput = {
  photoId: string;
  buyerEmail: string;
};

export type TeVisualsSyncEntitlementResponse =
  | { ok: true; owns: boolean; unlimited: boolean }
  | { ok: false; error: string; status?: number };

export type TeVisualsDownloadGrantInput = {
  photoId: string;
  /** Identifier from FOT-side auth — TE Visuals cross-references entitlement. */
  buyerEmail: string;
  /** Optional pre-issued grant token from TE Visuals (skip ownership check). */
  grantToken?: string;
};

export type TeVisualsDownloadGrantResponse =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; error: string; status?: number };
