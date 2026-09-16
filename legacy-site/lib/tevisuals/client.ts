// ---------------------------------------------------------------------------
// Server-only TE Visuals client.
//
// Reads `TEVISUALS_BASE_URL` and (optionally) `TEVISUALS_API_KEY` and talks to
// the typed contract in `./types.ts`.
//
// Production catalog fetches use Next's data cache (`revalidate=3600`, tag
// `tevisuals:catalog`). Admin sync calls `revalidateTag` + `revalidatePath` for
// photography. In development, when `NEXT_PUBLIC_PHOTOGRAPHY_SOURCE=tevisuals`,
// fetches use `cache: "no-store"` so deletes show up without waiting on cache.
//
// Filtering rule: every catalog response is normalized to drop:
//   * galleries that are not `visibility === "public"`
//   * photos whose `photographer !== "tom"` (Eric / team / unknown all OUT)
// This filter is enforced HERE so callers cannot accidentally leak Eric's
// work onto FocusedOnTom even if TE Visuals serves more than asked.
// ---------------------------------------------------------------------------

import "server-only";

import type {
  TeVisualsCatalogGallery,
  TeVisualsCatalogPhoto,
  TeVisualsCatalogResponse,
  TeVisualsCheckoutResponse,
  TeVisualsDownloadGrantInput,
  TeVisualsDownloadGrantResponse,
  TeVisualsSyncCheckoutInput,
  TeVisualsSyncEntitlementInput,
  TeVisualsSyncEntitlementResponse,
} from "./types";

export const TEVISUALS_CATALOG_TAG = "tevisuals:catalog";

/** Last successful normalized catalog sizes (for admin sync before/after logs). */
export type TeCatalogSnapshot = {
  galleries: number;
  photos: number;
  generatedAt?: string;
  updatedAt: number;
};

let lastTeCatalogSnapshot: TeCatalogSnapshot | null = null;

export function getLastTeCatalogSnapshot(): TeCatalogSnapshot | null {
  return lastTeCatalogSnapshot;
}

const DEFAULT_REVALIDATE_SECONDS = 3600;
const SYNC_PAGE_LIMIT = 100;

export type TeVisualsClientConfig = {
  baseUrl: string;
  apiKey: string | null;
};

export function getTeVisualsConfig(): TeVisualsClientConfig | null {
  const baseUrl = process.env.TEVISUALS_BASE_URL?.trim();
  if (!baseUrl) return null;
  const apiKey = process.env.TEVISUALS_API_KEY?.trim() || null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

/**
 * Checkout forwarding requires both URL and API key; log each gap separately for ops.
 */
export function getTeVisualsForwardConfig(): TeVisualsClientConfig | null {
  const rawBase = process.env.TEVISUALS_BASE_URL?.trim();
  const rawKey = process.env.TEVISUALS_API_KEY?.trim();
  if (!rawBase) {
    console.error("[tevisuals] checkout forward blocked: missing TEVISUALS_BASE_URL");
    return null;
  }
  if (!rawKey) {
    console.error("[tevisuals] checkout forward blocked: missing TEVISUALS_API_KEY");
    return null;
  }
  return { baseUrl: rawBase.replace(/\/+$/, ""), apiKey: rawKey };
}

/** Same manifest/catalog env check as today (base URL only). */
export function isPhotographySourceTeVisuals(): boolean {
  return process.env.PHOTOGRAPHY_SOURCE?.trim().toLowerCase() === "tevisuals";
}

/** True when env says we should be reading from TE Visuals. */
export function isTeVisualsSourceEnabled(): boolean {
  return isPhotographySourceTeVisuals() && getTeVisualsConfig() !== null;
}

/**
 * In development, skip the Next data cache for TE catalog fetches so deletes in
 * TE Visuals show up without waiting for revalidate (mirrors NEXT_PUBLIC bundle).
 */
function teCatalogDevNoStoreEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_PHOTOGRAPHY_SOURCE?.trim().toLowerCase() ===
      "tevisuals"
  );
}

/** Stripe checkout runs on TE when photography is TE-backed and secrets are complete. */
export function isTeVisualsCheckoutForwardingEnabled(): boolean {
  return isPhotographySourceTeVisuals() && getTeVisualsForwardConfig() !== null;
}

function buildHeaders(
  config: TeVisualsClientConfig,
  extra?: Record<string, string>
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(extra ?? {}),
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Defensive normalization
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizePhoto(raw: unknown): TeVisualsCatalogPhoto | null {
  if (!isPlainObject(raw)) return null;
  const id = asString(raw.id);
  const src = asString(raw.src) ?? asString(raw.url) ?? asString(raw.publicUrl);
  const width = asNumber(raw.width);
  const height = asNumber(raw.height);
  const filename = asString(raw.filename) ?? `${id ?? "photo"}.jpg`;
  if (!id || !src || width == null || height == null) return null;

  const photographerRaw = asString(raw.photographer)?.toLowerCase() ?? "team";
  const photographer =
    photographerRaw === "tom" || photographerRaw === "eric"
      ? (photographerRaw as "tom" | "eric")
      : "team";

  const exifRaw = isPlainObject(raw.exif) ? raw.exif : null;
  const sectionRaw = isPlainObject(raw.section) ? raw.section : null;
  const exif = exifRaw
    ? {
        camera: asString(exifRaw.camera),
        lens: asString(exifRaw.lens),
        iso: asNumber(exifRaw.iso) ?? asString(exifRaw.iso),
        focalLength: asString(exifRaw.focalLength),
        aperture: asString(exifRaw.aperture),
        shutterSpeed: asString(exifRaw.shutterSpeed),
      }
    : null;

  return {
    id,
    photoId: asString(raw.photoId) ?? id,
    galleryId: asString(raw.galleryId) ?? asString(raw.gallery_id),
    galleryTitle: asString(raw.galleryTitle) ?? asString(raw.gallery_title),
    gallerySlug: asString(raw.gallerySlug) ?? asString(raw.gallery_slug),
    category: asString(raw.category)?.toLowerCase() ?? null,
    filename,
    photographer,
    src,
    thumbSrc: asString(raw.thumbSrc) ?? null,
    publicUrl: asString(raw.publicUrl) ?? null,
    proxyUrl: asString(raw.proxyUrl) ?? null,
    width,
    height,
    techCaption: asString(raw.techCaption),
    capturedAt: asString(raw.capturedAt) ?? asString(raw.captured_at),
    createdAt: asString(raw.createdAt) ?? asString(raw.created_at),
    sortOrder: asNumber(raw.sortOrder) ?? asNumber(raw.sort_order),
    displayOrder: asNumber(raw.displayOrder) ?? asNumber(raw.display_order),
    cursor: asString(raw.cursor),
    exif,
    sectionSlug:
      asString(raw.sectionSlug) ??
      asString(raw.section_slug) ??
      (sectionRaw ? asString((sectionRaw as Record<string, unknown>).slug) : null),
    sectionId:
      asString(raw.sectionId) ??
      asString(raw.section_id) ??
      (sectionRaw ? asString((sectionRaw as Record<string, unknown>).id) : null),
    sectionTitle:
      asString(raw.sectionTitle) ??
      asString(raw.section_title) ??
      (sectionRaw ? asString(sectionRaw.title) : null),
    sectionOrder:
      asNumber(raw.sectionOrder) ??
      asNumber(raw.section_order) ??
      (sectionRaw ? asNumber(sectionRaw.order) : null),
    photoOrderWithinSection:
      asNumber(raw.photoOrderWithinSection) ??
      asNumber(raw.photo_order_within_section),
    priceCents: asNumber(raw.priceCents) ?? asNumber(raw.price_cents),
    personalPriceCents:
      asNumber(raw.personalPriceCents) ??
      (isPlainObject(raw.prices)
        ? asNumber((raw.prices as Record<string, unknown>).personalCents)
        : null),
    commercialPriceCents:
      asNumber(raw.commercialPriceCents) ??
      (isPlainObject(raw.prices)
        ? asNumber((raw.prices as Record<string, unknown>).commercialCents)
        : null),
    currency: isPlainObject(raw.prices)
      ? asString((raw.prices as Record<string, unknown>).currency)
      : asString(raw.currency),
    prices: isPlainObject(raw.prices)
      ? {
          personalCents: asNumber((raw.prices as Record<string, unknown>).personalCents),
          commercialCents: asNumber((raw.prices as Record<string, unknown>).commercialCents),
          currency: asString((raw.prices as Record<string, unknown>).currency),
        }
      : null,
    watermarkRequired:
      typeof raw.watermarkRequired === "boolean"
        ? raw.watermarkRequired
        : null,
    isForSale:
      typeof raw.isForSale === "boolean"
        ? raw.isForSale
        : typeof raw.is_for_sale === "boolean"
          ? raw.is_for_sale
          : null,
  };
}

function normalizeGallery(raw: unknown): TeVisualsCatalogGallery | null {
  if (!isPlainObject(raw)) return null;
  const id = asString(raw.id);
  const slug = asString(raw.slug);
  const title = asString(raw.title);
  const category = asString(raw.category);
  if (!id || !slug || !title || !category) return null;

  const visibilityRaw = asString(raw.visibility)?.toLowerCase() ?? "public";
  const visibility = visibilityRaw === "private" ? "private" : "public";

  const photosRaw = Array.isArray(raw.photos) ? raw.photos : [];
  const photos = photosRaw
    .map(normalizePhoto)
    .filter((p): p is TeVisualsCatalogPhoto => p !== null);

  return {
    id,
    slug,
    category: category.toLowerCase(),
    visibility,
    title,
    description: asString(raw.description),
    coverPhotoId: asString(raw.coverPhotoId) ?? asString(raw.cover_photo_id),
    createdAt: asString(raw.createdAt) ?? asString(raw.created_at),
    photos,
  };
}

/**
 * TE Visuals sync manifest currently returns a flat `photos[]` array
 * (`/api/sync/focused-on-tom/manifest`). Group those rows into our internal
 * gallery shape.
 */
function normalizeGalleriesFromFlatPhotos(
  photosRaw: unknown[]
): TeVisualsCatalogGallery[] {
  const byGallery = new Map<string, TeVisualsCatalogGallery>();

  for (const row of photosRaw) {
    if (!isPlainObject(row)) continue;

    const photo = normalizePhoto({
      id: row.photoId ?? row.id,
      photoId: row.photoId ?? row.id,
      galleryId: row.galleryId,
      galleryTitle: row.galleryTitle,
      gallerySlug: row.gallerySlug,
      category: row.category,
      filename: row.filename,
      photographer: row.photographer,
      src: row.proxyUrl ?? row.publicUrl ?? row.src ?? row.url,
      publicUrl: row.publicUrl,
      proxyUrl: row.proxyUrl,
      width: row.width,
      height: row.height,
      techCaption: row.techCaption,
      capturedAt: row.capturedAt,
      createdAt: row.createdAt,
      sortOrder: row.sortOrder,
      displayOrder: row.displayOrder,
      cursor: row.cursor,
      sectionSlug: row.sectionSlug ?? row.section_slug,
      sectionId: row.sectionId ?? row.section_id,
      sectionTitle: row.sectionTitle ?? row.section_title,
      sectionOrder: row.sectionOrder ?? row.section_order,
      photoOrderWithinSection:
        row.photoOrderWithinSection ?? row.photo_order_within_section,
      ...(isPlainObject(row.section) ? { section: row.section } : {}),
      priceCents: isPlainObject(row.prices)
        ? (row.prices as Record<string, unknown>).personalCents
        : row.priceCents,
      personalPriceCents: isPlainObject(row.prices)
        ? (row.prices as Record<string, unknown>).personalCents
        : row.personalPriceCents,
      commercialPriceCents: isPlainObject(row.prices)
        ? (row.prices as Record<string, unknown>).commercialCents
        : row.commercialPriceCents,
      currency: isPlainObject(row.prices)
        ? (row.prices as Record<string, unknown>).currency
        : row.currency,
      watermarkRequired: row.watermarkRequired,
      isForSale: true,
    });
    if (!photo) continue;

    const galleryId =
      asString(row.galleryId) ??
      asString(row.gallery_id) ??
      asString(row.gallerySlug) ??
      "unknown-gallery";
    let gallery = byGallery.get(galleryId);
    if (!gallery) {
      const slug =
        asString(row.gallerySlug) ?? asString(row.gallery_slug) ?? galleryId;
      gallery = {
        id: galleryId,
        slug,
        category: (asString(row.category) ?? "automotive").toLowerCase(),
        visibility: "public",
        title: asString(row.galleryTitle) ?? asString(row.title) ?? slug,
        description: null,
        coverPhotoId: null,
        createdAt: asString(row.createdAt) ?? asString(row.created_at),
        date: asString(row.galleryDate) ?? asString(row.gallery_date),
        photos: [],
      };
      byGallery.set(galleryId, gallery);
    }

    const rowCoverPhotoId =
      asString(row.coverPhotoId) ?? asString(row.cover_photo_id);
    const rowIsCover = (row as Record<string, unknown>).isCover === true;
    if (!gallery.coverPhotoId && rowCoverPhotoId) {
      gallery.coverPhotoId = rowCoverPhotoId;
    }
    if (!gallery.coverPhotoId && rowIsCover) {
      gallery.coverPhotoId = photo.id;
    }

    gallery.photos.push(photo);
  }

  /** Preserve manifest row order inside each gallery — section/photo ordering is applied in the UI layer (sectionId → sectionOrder, then photoOrderWithinSection). */
  return [...byGallery.values()];
}

/** Apply the tom-only + public-only filter the rest of the app relies on. */
export function filterCatalogToTomPublic(
  catalog: TeVisualsCatalogResponse
): TeVisualsCatalogResponse {
  const galleries = catalog.galleries
    .filter((g) => g.visibility === "public")
    .map((g) => ({
      ...g,
      photos: g.photos.filter((p) => p.photographer === "tom"),
    }))
    .filter((g) => g.photos.length > 0);
  return { ...catalog, galleries };
}

// ---------------------------------------------------------------------------
// Catalog fetch (with Next data cache)
// ---------------------------------------------------------------------------

export type FetchCatalogOptions = {
  /** Override revalidate window in seconds. Defaults to 3600. */
  revalidate?: number;
  /** Pass a fresh AbortSignal for admin force-refresh paths. */
  signal?: AbortSignal;
  /** When true, bypass the data cache (admin sync route). */
  noCache?: boolean;
};

type SyncManifestPage = {
  photos: unknown[];
  pageInfo?: {
    hasMore?: boolean;
    nextCursor?: string | null;
  } | null;
  generatedAt?: string | null;
  baseUrl?: string | null;
};

/**
 * Fetches the public catalog from TE Visuals, normalizes it, and applies
 * the tom-only + public-only filter. Returns null when TE Visuals is not
 * configured or the call fails — caller decides what to fall back to.
 */
export async function fetchTeVisualsCatalog(
  options: FetchCatalogOptions = {}
): Promise<TeVisualsCatalogResponse | null> {
  const config = getTeVisualsConfig();
  if (!config) return null;

  const baseManifestUrl = `${config.baseUrl}/api/sync/focused-on-tom/manifest`;
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE_SECONDS;

  try {
    const allPhotos: unknown[] = [];
    let firstPageGalleriesRaw: unknown[] = [];
    let pagesFetched = 0;
    let cursor: string | null = null;
    let generatedAt: string | null = null;
    let baseUrl: string | null = null;

    const bypassDataCache =
      options.noCache === true || teCatalogDevNoStoreEnabled();

    for (;;) {
      const url = new URL(baseManifestUrl);
      url.searchParams.set("limit", String(SYNC_PAGE_LIMIT));
      if (cursor) url.searchParams.set("cursor", cursor);

      const response = await fetch(url.toString(), {
        headers: buildHeaders(config),
        signal: options.signal,
        ...(bypassDataCache
          ? { cache: "no-store" as const }
          : {
              next: {
                revalidate,
                tags: [TEVISUALS_CATALOG_TAG],
              },
            }),
      });
      if (!response.ok) {
        console.warn(
          `[tevisuals] catalog fetch failed: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const json = (await response.json()) as unknown;
      if (!isPlainObject(json)) return null;
      const page = json as SyncManifestPage;
      pagesFetched += 1;

      if (baseUrl === null) baseUrl = asString(page.baseUrl) ?? config.baseUrl;
      if (generatedAt === null) {
        generatedAt = asString(page.generatedAt) ?? new Date().toISOString();
      }

      if (Array.isArray((json as Record<string, unknown>).galleries)) {
        if (firstPageGalleriesRaw.length === 0) {
          firstPageGalleriesRaw = (json as Record<string, unknown>)
            .galleries as unknown[];
        }
      }
      if (Array.isArray(page.photos)) {
        allPhotos.push(...page.photos);
      }

      const hasMore = Boolean(page.pageInfo?.hasMore);
      const nextCursor = asString(page.pageInfo?.nextCursor ?? null);
      if (hasMore && nextCursor) {
        cursor = nextCursor;
        continue;
      }
      break;
    }

    const galleries =
      firstPageGalleriesRaw.length > 0
        ? firstPageGalleriesRaw
            .map(normalizeGallery)
            .filter((g): g is TeVisualsCatalogGallery => g !== null)
        : normalizeGalleriesFromFlatPhotos(allPhotos);

    const filtered = filterCatalogToTomPublic({
      generatedAt: generatedAt ?? new Date().toISOString(),
      baseUrl: baseUrl ?? config.baseUrl,
      galleries,
    });

    const totalFilteredPhotos = filtered.galleries.reduce(
      (acc, gallery) => acc + gallery.photos.length,
      0
    );
    lastTeCatalogSnapshot = {
      galleries: filtered.galleries.length,
      photos: totalFilteredPhotos,
      generatedAt: filtered.generatedAt,
      updatedAt: Date.now(),
    };

    if (process.env.NODE_ENV !== "production") {
      const totalPhotosReceived = allPhotos.length;
      const totalPhotos = totalFilteredPhotos;
      const firstFive = allPhotos
        .slice(0, 5)
        .map((row) => {
          const r = isPlainObject(row) ? row : {};
          return {
            sortOrder:
              asNumber((r as Record<string, unknown>).sortOrder) ??
              asNumber((r as Record<string, unknown>).sort_order),
            capturedAt:
              asString((r as Record<string, unknown>).capturedAt) ??
              asString((r as Record<string, unknown>).captured_at),
            createdAt:
              asString((r as Record<string, unknown>).createdAt) ??
              asString((r as Record<string, unknown>).created_at),
          };
        });
      console.log(
        `[tevisuals] catalog pages=${pagesFetched} received=${totalPhotosReceived} photos=${totalPhotos} galleries=${filtered.galleries.length}`
      );
      console.log("[tevisuals] first5 sort/captured/created", firstFive);

      const adamGallery = filtered.galleries.find((gallery) => {
        const slug = gallery.slug.toLowerCase();
        const title = gallery.title.toLowerCase();
        return slug.includes("adam-lz") || title.includes("adam lz");
      });
      if (adamGallery) {
        const incomingAdamRows = allPhotos
          .filter((row) => {
            if (!isPlainObject(row)) return false;
            const slug =
              asString((row as Record<string, unknown>).gallerySlug) ??
              asString((row as Record<string, unknown>).gallery_slug) ??
              "";
            const title =
              asString((row as Record<string, unknown>).galleryTitle) ??
              asString((row as Record<string, unknown>).gallery_title) ??
              "";
            return (
              slug.toLowerCase() === adamGallery.slug.toLowerCase() ||
              title.toLowerCase() === adamGallery.title.toLowerCase()
            );
          })
          .map((row) => {
            const r = row as Record<string, unknown>;
            return {
              filename: asString(r.filename),
              displayOrder:
                asNumber(r.displayOrder) ?? asNumber(r.display_order),
              sortOrder: asNumber(r.sortOrder) ?? asNumber(r.sort_order),
              capturedAt: asString(r.capturedAt) ?? asString(r.captured_at),
              createdAt: asString(r.createdAt) ?? asString(r.created_at),
            };
          });
        const incomingAdamTop20 = [...incomingAdamRows]
          .filter((row) => typeof row.displayOrder === "number")
          .sort(
            (a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
          )
          .slice(0, 20)
          .map((row) => ({
            filename: row.filename,
            displayOrder: row.displayOrder,
          }));
        console.log(
          "[tevisuals] Adam LZ incoming first20 by displayOrder",
          incomingAdamTop20
        );
        const incomingAdamPreview = incomingAdamRows
          .slice(0, 10)
          .map((row) => {
            return {
              filename: row.filename,
              displayOrder: row.displayOrder,
              sortOrder: row.sortOrder,
              capturedAt: row.capturedAt,
              createdAt: row.createdAt,
            };
          });
        console.log("[tevisuals] Adam LZ incoming first10", incomingAdamPreview);
      }
    }

    return filtered;
  } catch (error) {
    console.warn("[tevisuals] catalog fetch threw", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Checkout & download forwarders
// ---------------------------------------------------------------------------

export async function tvCreateCheckout(
  input: TeVisualsSyncCheckoutInput
): Promise<TeVisualsCheckoutResponse> {
  const config = getTeVisualsForwardConfig();
  if (!config?.apiKey) {
    return { ok: false, error: "tevisuals_forward_not_configured", status: 503 };
  }
  const urlCheckout = `${config.baseUrl}/api/sync/focused-on-tom/checkout`;
  try {
    const response = await fetch(urlCheckout, {
      method: "POST",
      headers: buildHeaders(config, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        photoId: input.photoId.trim(),
        license: input.license,
        returnUrl: input.returnUrl,
        buyerEmail: input.buyerEmail.trim(),
      }),
      cache: "no-store",
      // Do not pass `signal` — server-side checkout must not abort with client lifecycle.
    });
    const rawText = await response.text().catch(() => "");
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      /* non-JSON error body */
    }
    if (!response.ok) {
      const snippet = rawText.slice(0, 400);
      if (response.status === 401) {
        console.error(
          "[tevisuals] checkout 401 unauthorized — sync key mismatch? (TEVISUALS_API_KEY must match TE FOT_SYNC_API_KEY)",
          snippet
        );
      } else if (response.status === 404) {
        console.error(
          "[tevisuals] checkout 404 photo or endpoint not found",
          snippet
        );
      } else if (response.status >= 500) {
        console.error("[tevisuals] checkout server error", response.status, snippet);
      } else {
        console.warn(
          "[tevisuals] checkout failed",
          response.status,
          json.error ?? snippet
        );
      }
      return {
        ok: false,
        error: asString(json.error) ?? "tevisuals_checkout_failed",
        status: response.status,
      };
    }
    const url = asString(json.url);
    if (!url) {
      console.error("[tevisuals] checkout OK but missing url in body", rawText.slice(0, 400));
      return { ok: false, error: "tevisuals_missing_checkout_url", status: 502 };
    }
    return { ok: true, url };
  } catch (error) {
    console.error("[tevisuals] checkout request threw", error);
    return { ok: false, error: "tevisuals_unreachable", status: 502 };
  }
}

/**
 * Ask TE Visuals whether this email owns the photo or has Unlimited (TE-side DB).
 * Required for watermark + “owned” UI after TE-hosted Stripe checkout.
 */
export async function tvFocusedOnTomEntitlement(
  input: TeVisualsSyncEntitlementInput
): Promise<TeVisualsSyncEntitlementResponse> {
  const config = getTeVisualsForwardConfig();
  if (!config?.apiKey) {
    return { ok: false, error: "tevisuals_forward_not_configured", status: 503 };
  }
  const urlEntitlement = `${config.baseUrl}/api/sync/focused-on-tom/entitlement`;
  if (process.env.NODE_ENV === "development") {
    console.info("[tevisuals] entitlement POST", urlEntitlement, {
      photoId: input.photoId.trim(),
      buyerEmail: input.buyerEmail.trim(),
    });
  }
  try {
    // Never pass AbortSignal — avoids shared abort with navigation/React.
    const response = await fetch(urlEntitlement, {
      method: "POST",
      headers: buildHeaders(config, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        photoId: input.photoId.trim(),
        buyerEmail: input.buyerEmail.trim(),
      }),
      cache: "no-store",
    });
    const rawText = await response.text().catch(() => "");
    if (process.env.NODE_ENV === "development") {
      console.info("[tevisuals] entitlement raw response", {
        status: response.status,
        bodyPreview: rawText.slice(0, 800),
      });
    }
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      /* non-JSON */
    }
    if (!response.ok) {
      return {
        ok: false,
        error: asString(json.error) ?? "tevisuals_entitlement_failed",
        status: response.status,
      };
    }
    return {
      ok: true,
      owns: Boolean(json.owns),
      unlimited: Boolean(json.unlimited),
    };
  } catch (error) {
    console.warn("[tevisuals] entitlement request threw", error);
    return { ok: false, error: "tevisuals_unreachable", status: 502 };
  }
}

export async function tvCreateDownloadGrant(
  input: TeVisualsDownloadGrantInput
): Promise<TeVisualsDownloadGrantResponse> {
  const config = getTeVisualsConfig();
  if (!config) {
    return { ok: false, error: "tevisuals_not_configured", status: 501 };
  }
  try {
    const response = await fetch(
      `${config.baseUrl}/api/public/photography/download-grant`,
      {
        method: "POST",
        headers: buildHeaders(config, { "Content-Type": "application/json" }),
        body: JSON.stringify(input),
        cache: "no-store",
      }
    );
    const json = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok) {
      return {
        ok: false,
        error: asString(json.error) ?? "tevisuals_download_failed",
        status: response.status,
      };
    }
    const url = asString(json.url);
    const expiresAt =
      asString(json.expiresAt) ??
      new Date(Date.now() + 60 * 60 * 1000).toISOString();
    if (!url) {
      return { ok: false, error: "tevisuals_missing_download_url", status: 502 };
    }
    return { ok: true, url, expiresAt };
  } catch (error) {
    console.warn("[tevisuals] download grant call failed", error);
    return { ok: false, error: "tevisuals_unreachable", status: 502 };
  }
}
