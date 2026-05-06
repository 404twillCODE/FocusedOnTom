// ---------------------------------------------------------------------------
// Server-only async photography source.
//
// Strategy (chosen during the TE Visuals migration):
//   1. When `PHOTOGRAPHY_SOURCE=tevisuals` and TE Visuals is configured,
//      fetch the public catalog (tom-only, public-only) with Next 16's
//      data cache (`revalidate=3600`, tag `tevisuals:catalog`). Admin sync
//      route force-refreshes via `revalidateTag`.
//   2. When TE is configured but `fetchTeVisualsCatalog()` returns **null**
//      (transport/parse/network failure **only**), fall back to the bundled
//      `photography-manifest.json`. A successful TE response with **fewer**
//      galleries after deletes is authoritative — nothing is merged with the local
//      manifest while `PHOTOGRAPHY_SOURCE=tevisuals`.
//
// Pages call `loadPhotographyData()` server-side and pass the result down
// to client subtrees as props.
// ---------------------------------------------------------------------------

import "server-only";

import {
  countPhotos as countPhotosLocal,
  getCoverPhoto as getCoverPhotoLocal,
  photoCategories as localPhotoCategories,
  type Photo,
  type PhotoCategory,
  type PhotoEvent,
  type PhotoWithContext,
  type RecentPhoto,
} from "./photography";
import {
  fetchTeVisualsCatalog,
  isTeVisualsSourceEnabled,
} from "./tevisuals/client";
import {
  focusedontomCategoryForGallery,
  TEVISUALS_DEFAULT_CATEGORY,
} from "./tevisuals/category-map";
import type {
  TeVisualsCatalogGallery,
  TeVisualsCatalogPhoto,
} from "./tevisuals/types";

export type PhotographyData = {
  /** Display categories with their events + photos. */
  categories: PhotoCategory[];
  /** Cached lookup by photo id. */
  byId: Map<string, PhotoWithContext>;
  /** Cached lookup by `${category}/${event}` slug pair. */
  events: Map<string, { category: PhotoCategory; event: PhotoEvent }>;
  /** Source we ended up using — for diagnostics / footer / admin UI. */
  source: "tevisuals" | "local-manifest";
  /** ISO timestamp the catalog was generated at (TE Visuals) or manifest write time. */
  generatedAt?: string;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function buildLookups(
  categories: PhotoCategory[]
): Pick<PhotographyData, "byId" | "events"> {
  const byId = new Map<string, PhotoWithContext>();
  const events = new Map<string, { category: PhotoCategory; event: PhotoEvent }>();
  for (const cat of categories) {
    for (const ev of cat.events) {
      events.set(`${cat.slug}/${ev.slug}`, { category: cat, event: ev });
      for (const photo of ev.photos) {
        if (photo.id) {
          byId.set(photo.id, {
            ...photo,
            categoryTitle: cat.title,
            eventTitle: ev.title,
          });
        }
      }
    }
  }
  return { byId, events };
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function formatMonthYear(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function parseIsoTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function pickGalleryDisplayDate(gallery: TeVisualsCatalogGallery, photos: Photo[]): string {
  const galleryDateCandidate = gallery.date ?? null;
  const asFormatted = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const parsed = formatMonthYear(value);
    return parsed ?? value;
  };

  // 1) explicit gallery date from TE Visuals
  const galleryDate = asFormatted(galleryDateCandidate);
  if (galleryDate) return galleryDate;

  // 2) first photo capturedAt (TE order first)
  const firstCaptured = photos[0]?.capturedAt ?? photos[0]?.exif?.takenAt;
  const firstCapturedDate = asFormatted(firstCaptured);
  if (firstCapturedDate) return firstCapturedDate;

  // 3) earliest capturedAt in gallery
  const earliestCaptured = photos
    .map((photo) => photo.capturedAt ?? photo.exif?.takenAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0];
  const earliestDate = asFormatted(earliestCaptured);
  if (earliestDate) return earliestDate;

  // 4) createdAt fallback
  const createdFallback = asFormatted(gallery.createdAt ?? photos[0]?.createdAt);
  if (createdFallback) return createdFallback;

  return "Recent";
}

function pickGallerySortTimestamp(
  gallery: TeVisualsCatalogGallery,
  photos: Photo[]
): number {
  // 1) explicit gallery date (if parseable)
  const galleryDateTs = parseIsoTimestamp(gallery.date ?? null);
  if (galleryDateTs !== null) return galleryDateTs;

  // 2) cover/first photo capturedAt
  const coverOrFirst = gallery.coverPhotoId
    ? photos.find((photo) => photo.id === gallery.coverPhotoId) ?? photos[0]
    : photos[0];
  const coverCapturedTs = parseIsoTimestamp(
    coverOrFirst?.capturedAt ?? coverOrFirst?.exif?.takenAt
  );
  if (coverCapturedTs !== null) return coverCapturedTs;

  // 3) newest capturedAt in gallery
  const newestCapturedTs = photos.reduce<number | null>((latest, photo) => {
    const ts = parseIsoTimestamp(photo.capturedAt ?? photo.exif?.takenAt);
    if (ts === null) return latest;
    if (latest === null || ts > latest) return ts;
    return latest;
  }, null);
  if (newestCapturedTs !== null) return newestCapturedTs;

  // 4) createdAt fallback
  const createdTs = parseIsoTimestamp(gallery.createdAt ?? photos[0]?.createdAt);
  if (createdTs !== null) return createdTs;
  return 0;
}

function parseTechCaptionToExif(
  techCaption?: string | null,
  capturedAt?: string | null
): Photo["exif"] | undefined {
  if (!techCaption && !capturedAt) return undefined;
  const raw = (techCaption ?? "").replace(/\n/g, " ");
  const parts = raw
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean);
  const out: NonNullable<Photo["exif"]> = {};
  if (parts[0]) out.camera = parts[0];
  if (parts[1]) out.lens = parts[1];
  for (const part of parts.slice(2)) {
    if (/^ISO\s*\d+/i.test(part)) {
      out.iso = part.replace(/\s+/g, " ");
      continue;
    }
    if (/^f\/[\d.]+/i.test(part)) {
      out.aperture = part;
      continue;
    }
    if (/^\d+mm$/i.test(part)) {
      out.focal = part;
      continue;
    }
    if (/^\d+\/\d+s?$/i.test(part) || /^\d+(\.\d+)?s$/i.test(part)) {
      out.shutter = /s$/i.test(part) ? part : `${part}s`;
    }
  }
  if (capturedAt) out.takenAt = capturedAt;
  return Object.keys(out).length > 0 ? out : undefined;
}

// ---------------------------------------------------------------------------
// TE Visuals → PhotoCategory[] transform
// ---------------------------------------------------------------------------

function tvPhotoToFotPhoto(
  p: TeVisualsCatalogPhoto,
  displayCategorySlug: string,
  eventSlug: string
): Photo {
  const altBase = p.filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const caption = p.filename || altBase || "Photo";
  const tech = p.techCaption?.replace(/\s+/g, " ").trim();
  const exif = p.exif
    ? {
        camera: p.exif.camera ?? undefined,
        lens: p.exif.lens ?? undefined,
        shutter: p.exif.shutterSpeed ?? undefined,
        aperture: p.exif.aperture ?? undefined,
        iso:
          typeof p.exif.iso === "number"
            ? `ISO ${p.exif.iso}`
            : p.exif.iso ?? undefined,
        focal: p.exif.focalLength ?? undefined,
        takenAt: p.capturedAt ?? undefined,
      }
    : parseTechCaptionToExif(tech, p.capturedAt);
  return {
    src: p.src,
    alt: altBase || "Photo",
    caption,
    width: p.width,
    height: p.height,
    folderPath: "",
    exif,
    id: p.id,
    photo_id: p.id,
    /** Synthetic stable identifier. Not a real R2 key — TE Visuals owns the storage. */
    path: `tevisuals/${eventSlug}/${p.id}`,
    /** Originals never live on FOT R2 anymore. */
    original_key: undefined,
    public_key: undefined,
    public_size: undefined,
    original_size: undefined,
    price: p.personalPriceCents ?? p.priceCents ?? undefined,
    is_for_sale: p.isForSale ?? true,
    categorySlug: displayCategorySlug,
    eventSlug,
    filename: p.filename,
    techCaption: tech,
    capturedAt: p.capturedAt ?? undefined,
    photographer: p.photographer,
    section: p.sectionSlug ?? undefined,
    sectionId: p.sectionId ?? undefined,
    sectionTitle: p.sectionTitle ?? undefined,
    sectionSlug: p.sectionSlug ?? undefined,
    sectionOrder: p.sectionOrder ?? undefined,
    photoOrderWithinSection: p.photoOrderWithinSection ?? undefined,
    personalPriceCents: p.personalPriceCents ?? p.priceCents ?? undefined,
    commercialPriceCents: p.commercialPriceCents ?? undefined,
    watermarkRequired: p.watermarkRequired ?? undefined,
    displayOrder: p.displayOrder ?? undefined,
    sortOrder: p.sortOrder ?? undefined,
    createdAt: p.createdAt ?? undefined,
    cursor: p.cursor ?? undefined,
    galleryId: p.galleryId ?? undefined,
    galleryTitle: p.galleryTitle ?? undefined,
    gallerySlug: p.gallerySlug ?? undefined,
    category: p.category ?? undefined,
    publicUrl: p.publicUrl ?? undefined,
    proxyUrl: p.proxyUrl ?? undefined,
    prices: {
      personalCents: p.personalPriceCents ?? p.priceCents ?? undefined,
      commercialCents: p.commercialPriceCents ?? undefined,
      currency: p.currency ?? undefined,
    },
  };
}

function tvGalleryToFotEvent(
  gallery: TeVisualsCatalogGallery,
  displayCategorySlug: string
): PhotoEvent & { teSortTs: number } {
  const photos = gallery.photos.map((p) =>
    tvPhotoToFotPhoto(p, displayCategorySlug, gallery.slug)
  );

  const earliest = photos
    .map((p) => p.exif?.takenAt)
    .filter((v): v is string => Boolean(v))
    .sort()[0];

  const cover =
    (gallery.coverPhotoId
      ? gallery.photos.find((p) => p.id === gallery.coverPhotoId)?.src
      : undefined) ?? photos[0]?.src;

  return {
    slug: gallery.slug,
    title: gallery.title,
    date: pickGalleryDisplayDate(gallery, photos),
    location: undefined,
    summary: gallery.description ?? undefined,
    cover,
    takenAt: earliest ?? gallery.createdAt ?? undefined,
    photos,
    teSortTs: pickGallerySortTimestamp(gallery, photos),
  };
}

const FOT_CATEGORY_META: Array<{
  slug: string;
  title: string;
  tagline: string;
  description?: string;
}> = [
  {
    slug: "cars",
    title: "Cars",
    tagline: "Meets, builds, and anything with four wheels.",
    description: "Car meets, parking-lot finds, and the occasional track shot",
  },
  {
    slug: "landscape",
    title: "Landscape",
    tagline: "Skies, coastlines, and quiet places.",
    description:
      "Wide frames. Golden hour when I can get it, overcast when I can't.",
  },
  {
    slug: "street",
    title: "Street",
    tagline: "People, cities, small moments.",
    description:
      "Candid frames from walks around town — the stuff that doesn't wait for a second take.",
  },
];

function transformCatalogToCategories(
  galleries: TeVisualsCatalogGallery[]
): PhotoCategory[] {
  const eventsByCategory = new Map<string, Array<PhotoEvent & { teSortTs: number }>>();
  for (const gallery of galleries) {
    if (gallery.photos.length === 0) continue;
    const displaySlug = focusedontomCategoryForGallery(gallery);
    const event = tvGalleryToFotEvent(gallery, displaySlug);
    const list = eventsByCategory.get(displaySlug) ?? [];
    list.push(event);
    eventsByCategory.set(displaySlug, list);
  }

  // TE-backed category/event cards should show newest galleries first.
  for (const list of eventsByCategory.values()) {
    list.sort((a, b) => {
      if (a.teSortTs !== b.teSortTs) return b.teSortTs - a.teSortTs;
      return b.slug.localeCompare(a.slug);
    });
  }

  const known = new Set(FOT_CATEGORY_META.map((m) => m.slug));
  const extraSlugs = [...eventsByCategory.keys()].filter(
    (slug) => !known.has(slug)
  );

  function stripTeSort(events: Array<PhotoEvent & { teSortTs: number }>): PhotoEvent[] {
    return events.map((event) => {
      const copy = { ...event } as PhotoEvent & { teSortTs?: number };
      delete copy.teSortTs;
      return copy;
    });
  }

  const categories: PhotoCategory[] = [
    ...FOT_CATEGORY_META.map((meta) => ({
      ...meta,
      events: stripTeSort(eventsByCategory.get(meta.slug) ?? []),
    })),
    ...extraSlugs.map((slug) => ({
      slug,
      title: titleCaseFromSlug(slug),
      tagline: "",
      events: stripTeSort(eventsByCategory.get(slug) ?? []),
    })),
  ];

  // Drop empty FOT categories so the index doesn't show "0 photos" buckets,
  // unless we're showing the default bucket alone.
  const out = categories.filter(
    (c) => c.events.length > 0 || c.slug === TEVISUALS_DEFAULT_CATEGORY
  );
  if (process.env.NODE_ENV !== "production") {
    const firstCategoryWithEvents = out.find((category) => category.events.length > 0);
    const firstGallery = firstCategoryWithEvents?.events[0];
    if (firstGallery) {
      const preview = firstGallery.photos.slice(0, 10).map((photo) => ({
        id: photo.id,
        sortOrder: photo.sortOrder,
        capturedAt: photo.capturedAt ?? photo.exif?.takenAt,
        createdAt: photo.createdAt,
      }));
      console.log(
        `[photography-source] first gallery mapped category=${firstCategoryWithEvents?.slug} event=${firstGallery.slug} photos=${firstGallery.photos.length}`
      );
      console.log("[photography-source] first gallery order preview", preview);
      const coverFilename =
        firstGallery.photos.find((photo) => photo.src === firstGallery.cover)?.filename ??
        firstGallery.photos[0]?.filename ??
        "unknown";
      console.log(
        `[photography-source] first gallery cover=${coverFilename} date=${firstGallery.date}`
      );
    }

    const adamGallery = out
      .flatMap((category) =>
        category.events.map((event) => ({ category: category.slug, event }))
      )
      .find(({ event }) => {
        const slug = event.slug.toLowerCase();
        const title = event.title.toLowerCase();
        return slug.includes("adam-lz") || title.includes("adam lz");
      });
    if (adamGallery) {
      const first10 = adamGallery.event.photos.slice(0, 10).map((photo) => ({
        filename: photo.filename ?? photo.alt,
        displayOrder: photo.displayOrder,
        sortOrder: photo.sortOrder,
        capturedAt: photo.capturedAt ?? photo.exif?.takenAt,
        createdAt: photo.createdAt,
      }));
      const coverFilename =
        adamGallery.event.photos.find((photo) => photo.src === adamGallery.event.cover)
          ?.filename ??
        adamGallery.event.photos[0]?.filename ??
        "unknown";
      console.log("[photography-source] Adam LZ mapped first10", first10);
      const first20ByDisplayOrder = adamGallery.event.photos.slice(0, 20).map((photo) => ({
        filename: photo.filename ?? photo.alt,
        displayOrder: photo.displayOrder,
      }));
      console.log(
        "[photography-source] Adam LZ mapped first20 final",
        first20ByDisplayOrder
      );
      console.log(
        `[photography-source] Adam LZ cover=${coverFilename} date=${adamGallery.event.date}`
      );
    }

    const carsCategory = out.find((category) => category.slug === "cars");
    if (carsCategory) {
      const carsOrder = carsCategory.events.map((event) => ({
        title: event.title,
        displayDate: event.date,
        sortTs: parseIsoTimestamp(event.takenAt) ?? null,
      }));
      console.log("[photography-source] cars sorted order", carsOrder);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public loader
// ---------------------------------------------------------------------------

let inflight: Promise<PhotographyData> | null = null;

/**
 * Server-side entry point used by every photography page. Idempotent within
 * a single request — Next 16's data cache de-dupes the underlying TE Visuals
 * fetch across renders, and we additionally collapse concurrent calls into
 * the same in-flight promise.
 */
export function loadPhotographyData(): Promise<PhotographyData> {
  if (inflight) return inflight;
  inflight = doLoad().finally(() => {
    // Reset on next tick so the next request starts fresh; the underlying
    // fetch remains cached by Next regardless.
    queueMicrotask(() => {
      inflight = null;
    });
  });
  return inflight;
}

async function doLoad(): Promise<PhotographyData> {
  if (isTeVisualsSourceEnabled()) {
    const catalog = await fetchTeVisualsCatalog();
    if (catalog) {
      const categories = transformCatalogToCategories(catalog.galleries);
      const lookups = buildLookups(categories);
      return {
        categories,
        ...lookups,
        source: "tevisuals",
        generatedAt: catalog.generatedAt,
      };
    }
    console.warn(
      "[photography-source] TE Visuals unreachable (catalog fetch returned null); using local manifest only as offline fallback — not merging with stale TE cache"
    );
  }

  // Fallback: the bundled local manifest (existing behavior).
  const categories = localPhotoCategories;
  const lookups = buildLookups(categories);
  return {
    categories,
    ...lookups,
    source: "local-manifest",
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers — same shape as `lib/photography.ts`, async edition
// ---------------------------------------------------------------------------

export async function loadCategory(rawSlug: string): Promise<PhotoCategory | undefined> {
  const data = await loadPhotographyData();
  return data.categories.find(
    (c) => c.slug === rawSlug || c.slug === safeDecode(rawSlug)
  );
}

export async function loadEvent(
  categorySlug: string,
  eventSlug: string
): Promise<{ category: PhotoCategory; event: PhotoEvent } | undefined> {
  const data = await loadPhotographyData();
  const direct = data.events.get(`${categorySlug}/${eventSlug}`);
  if (direct) return direct;
  const decoded = data.events.get(
    `${safeDecode(categorySlug)}/${safeDecode(eventSlug)}`
  );
  return decoded;
}

export async function loadPhotoById(
  id: string
): Promise<PhotoWithContext | undefined> {
  const data = await loadPhotographyData();
  return data.byId.get(id);
}

export async function loadRecentPhotos(count = 3): Promise<RecentPhoto[]> {
  const data = await loadPhotographyData();
  const all: RecentPhoto[] = [];
  for (const cat of data.categories) {
    for (const ev of cat.events) {
      for (const photo of ev.photos) {
        all.push({
          ...photo,
          categorySlug: cat.slug,
          categoryTitle: cat.title,
          eventSlug: ev.slug,
          eventTitle: ev.title,
        });
      }
    }
  }
  all.sort((a, b) => {
    const ta = a.exif?.takenAt ? Date.parse(a.exif.takenAt) : 0;
    const tb = b.exif?.takenAt ? Date.parse(b.exif.takenAt) : 0;
    return tb - ta;
  });
  return all.slice(0, count);
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// Re-exports so server pages have a single import surface.
export {
  countPhotosLocal as countPhotos,
  getCoverPhotoLocal as getCoverPhoto,
};
export type { Photo, PhotoCategory, PhotoEvent, PhotoWithContext, RecentPhoto };
