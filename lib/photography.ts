// Photography manifest.
// ---------------------------------------------------------------------------
// Photos live locally under ./photography/ (git-ignored). The sync script
// (`npm run photos:sync`) compresses them to WebP, uploads to Cloudflare R2,
// and writes `lib/photography-manifest.json` — which is what this module
// reads at build/runtime.
//
// See docs/ADDING_PHOTOS.md for the full workflow.
// ---------------------------------------------------------------------------

import manifest from "./photography-manifest.json";

// ---------------------------------------------------------------------------
// Public types (consumed by UI)
// ---------------------------------------------------------------------------

export type ExifInfo = {
  camera?: string;
  lens?: string;
  shutter?: string;
  aperture?: string;
  iso?: string;
  focal?: string;
  takenAt?: string; // ISO date
};

export type Photo = {
  /** Absolute URL (R2 CDN). Ready for <img src> or <Image src>. */
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** Subfolder path relative to the event (e.g. "drifting/day-1"). Empty for top level. */
  folderPath?: string;
  exif?: ExifInfo;
  /** Stable 12-char photo id (from the sync script). Used by likes / orders. */
  id?: string;
  photo_id?: string;
  /** Canonical photo path within the bucket, e.g. "cars/event/photo.webp". */
  path?: string;
  original_key?: string;
  public_key?: string;
  public_size?: number;
  original_size?: number;
  price?: number;
  is_for_sale?: boolean;
  /** Category slug the photo belongs to (populated when traversing categories). */
  categorySlug?: string;
  /** Event slug the photo belongs to. */
  eventSlug?: string;
  /** Optional GPS if the sync script was run with PHOTOGRAPHY_INCLUDE_GPS=true. */
  gps?: { lat: number; lng: number };
  /** TE Visuals metadata passthrough fields (safe optional no-ops for legacy). */
  filename?: string;
  techCaption?: string;
  capturedAt?: string;
  photographer?: "tom" | "eric" | "team";
  section?: string;
  sectionId?: string;
  sectionTitle?: string;
  sectionSlug?: string;
  sectionOrder?: number;
  photoOrderWithinSection?: number;
  personalPriceCents?: number;
  commercialPriceCents?: number;
  watermarkRequired?: boolean;
  sortOrder?: number;
  createdAt?: string;
  cursor?: string;
  displayOrder?: number;
  galleryId?: string;
  galleryTitle?: string;
  gallerySlug?: string;
  category?: string;
  publicUrl?: string;
  proxyUrl?: string;
  prices?: {
    personalCents?: number;
    commercialCents?: number;
    currency?: string;
  };
};

export type PhotoEvent = {
  slug: string;
  title: string;
  date: string;
  location?: string;
  summary?: string;
  cover?: string;
  takenAt?: string;
  photos: Photo[];
};

export type PhotoCategory = {
  slug: string;
  title: string;
  tagline: string;
  description?: string;
  events: PhotoEvent[];
};

// ---------------------------------------------------------------------------
// Manifest types (what the sync script writes)
// ---------------------------------------------------------------------------

type ManifestExif = {
  camera?: string;
  lens?: string;
  iso?: number | string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
};

type ManifestPhoto = {
  id: string;
  photo_id?: string;
  gallery_slug?: string;
  filename: string;
  originalFilename: string;
  original_key?: string;
  public_key?: string;
  path: string;
  url: string;
  width: number;
  height: number;
  size: number;
  original_size?: number;
  public_size?: number;
  price?: number;
  is_for_sale?: boolean;
  folderPath?: string;
  takenAt?: string;
  exif?: ManifestExif;
  gps?: { lat: number; lng: number };
};

type ManifestFolder = {
  path: string;
  category: string;
  event: string;
  name: string;
  title: string;
  photoCount: number;
  cover?: string;
  takenAt?: string;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  eventSummary?: string;
  photos: ManifestPhoto[];
};

type ManifestEvent = {
  path: string;
  category: string;
  slug: string;
  title: string;
  date?: string;
  location?: string;
  summary?: string;
  takenAt?: string;
  photoCount: number;
  cover?: string;
  folderCount: number;
};

type Manifest = {
  generatedAt: string;
  baseUrl: string;
  folders: ManifestFolder[];
  events?: ManifestEvent[];
};

// ---------------------------------------------------------------------------
// Category definitions (edit titles / taglines / descriptions here)
// ---------------------------------------------------------------------------

type CategoryMeta = Omit<PhotoCategory, "events">;

const categoryMeta: CategoryMeta[] = [
  {
    slug: "cars",
    title: "Cars",
    tagline: "Meets, builds, and anything with four wheels.",
    description:
      "Car meets, parking-lot finds, and the occasional track shot",
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

// ---------------------------------------------------------------------------
// Build categories / events / photos from the manifest
// ---------------------------------------------------------------------------

const data = manifest as Manifest;

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

function formatMonthYearISO(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function mapExif(e?: ManifestExif, takenAt?: string): ExifInfo | undefined {
  if (!e && !takenAt) return undefined;
  const out: ExifInfo = {};
  if (e?.camera) out.camera = e.camera;
  if (e?.lens) out.lens = e.lens;
  if (e?.iso !== undefined && e.iso !== null) {
    out.iso = typeof e.iso === "number" ? `ISO ${e.iso}` : String(e.iso);
  }
  if (e?.focalLength) out.focal = e.focalLength;
  if (e?.aperture) out.aperture = e.aperture;
  if (e?.shutterSpeed) {
    out.shutter = /s$/.test(e.shutterSpeed)
      ? e.shutterSpeed
      : `${e.shutterSpeed}s`;
  }
  if (takenAt) out.takenAt = takenAt;
  return Object.keys(out).length > 0 ? out : undefined;
}

function toPhoto(
  mp: ManifestPhoto,
  categorySlug: string,
  eventSlug: string
): Photo {
  const alt =
    mp.originalFilename
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Photo";

  return {
    src: mp.url,
    alt,
    width: mp.width,
    height: mp.height,
    folderPath: mp.folderPath ?? "",
    exif: mapExif(mp.exif, mp.takenAt),
    id: mp.id,
    photo_id: mp.photo_id ?? mp.id,
    path: mp.path,
    original_key: mp.original_key,
    public_key: mp.public_key,
    original_size: mp.original_size,
    public_size: mp.public_size ?? mp.size,
    price: mp.price,
    is_for_sale: mp.is_for_sale,
    categorySlug,
    eventSlug,
    gps: mp.gps,
  };
}

const folderArray: ManifestFolder[] = Array.isArray(data.folders)
  ? data.folders
  : [];

// Group folders into (category, event) → aggregate photos in folder order
type EventBucket = {
  category: string;
  event: string;
  folders: ManifestFolder[];
};
const eventBuckets = new Map<string, EventBucket>();
for (const f of folderArray) {
  const key = `${f.category}/${f.event}`;
  let bucket = eventBuckets.get(key);
  if (!bucket) {
    bucket = { category: f.category, event: f.event, folders: [] };
    eventBuckets.set(key, bucket);
  }
  bucket.folders.push(f);
}

// Build PhotoEvent list per category
const eventsByCategory = new Map<string, PhotoEvent[]>();
for (const bucket of eventBuckets.values()) {
  // Root folder (name === "") first, then nested folders alphabetically
  bucket.folders.sort((a, b) => {
    if (a.name === "" && b.name !== "") return -1;
    if (a.name !== "" && b.name === "") return 1;
    return a.name.localeCompare(b.name);
  });

  const photos: Photo[] = [];
  for (const folder of bucket.folders) {
    for (const mp of folder.photos) {
      photos.push(toPhoto(mp, bucket.category, bucket.event));
    }
  }

  // Pick event meta from any folder that carried it, or defaults.
  const withEventMeta =
    bucket.folders.find((f) => f.eventTitle || f.eventDate || f.eventLocation) ??
    bucket.folders[0];

  const takenAts = photos
    .map((p) => p.exif?.takenAt)
    .filter((v): v is string => Boolean(v))
    .sort();
  const earliest = takenAts[0];

  const slug = bucket.event;
  const title =
    withEventMeta?.eventTitle ??
    (bucket.folders[0]?.name === "" ? bucket.folders[0].title : undefined) ??
    titleCaseFromSlug(slug);

  const date =
    withEventMeta?.eventDate ?? formatMonthYearISO(earliest) ?? "Recent";

  const cover =
    bucket.folders.find((f) => f.cover)?.cover ?? photos[0]?.src;

  const event: PhotoEvent = {
    slug,
    title,
    date,
    location: withEventMeta?.eventLocation,
    summary: withEventMeta?.eventSummary,
    cover,
    takenAt: earliest,
    photos,
  };

  const list = eventsByCategory.get(bucket.category) ?? [];
  list.push(event);
  eventsByCategory.set(bucket.category, list);
}

// Sort events in each category most-recent first
for (const list of eventsByCategory.values()) {
  list.sort((a, b) => {
    const ta = a.takenAt ? Date.parse(a.takenAt) : 0;
    const tb = b.takenAt ? Date.parse(b.takenAt) : 0;
    if (ta !== tb) return tb - ta;
    return b.slug.localeCompare(a.slug);
  });
}

// Assemble category list: explicit categoryMeta first, then any extras
// auto-discovered from the manifest.
const knownSlugs = new Set(categoryMeta.map((c) => c.slug));
const extraSlugs = [...eventsByCategory.keys()].filter(
  (slug) => !knownSlugs.has(slug)
);

export const photoCategories: PhotoCategory[] = [
  ...categoryMeta.map((meta) => ({
    ...meta,
    events: eventsByCategory.get(meta.slug) ?? [],
  })),
  ...extraSlugs.map((slug) => ({
    slug,
    title: titleCaseFromSlug(slug),
    tagline: "",
    events: eventsByCategory.get(slug) ?? [],
  })),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe decode for a single path segment (handles `%7C` vs `|`, etc.). */
function tryDecodePathSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Use this for every Link to an event page so slugs with `|`, spaces, or `&`
 * survive the URL bar and client-side routing.
 */
export function eventPageHref(categorySlug: string, eventSlug: string): string {
  return `/photography/${encodeURIComponent(categorySlug)}/${encodeURIComponent(eventSlug)}`;
}

export function categoryPageHref(categorySlug: string): string {
  return `/photography/${encodeURIComponent(categorySlug)}`;
}

export function getCategory(rawSlug: string): PhotoCategory | undefined {
  const decoded = tryDecodePathSegment(rawSlug);
  return photoCategories.find(
    (c) => c.slug === rawSlug || c.slug === decoded
  );
}

export function getEvent(
  categorySlug: string,
  eventSlugParam: string
): { category: PhotoCategory; event: PhotoEvent } | undefined {
  const category = getCategory(categorySlug);
  if (!category) return undefined;
  const decoded = tryDecodePathSegment(eventSlugParam);
  const event = category.events.find(
    (e) => e.slug === eventSlugParam || e.slug === decoded
  );
  if (!event) return undefined;
  return { category, event };
}

export function getCoverPhoto(event: PhotoEvent): Photo | undefined {
  if (event.cover) {
    return {
      src: event.cover,
      alt: event.title,
      width: 2000,
      height: 1333,
    };
  }
  return event.photos[0];
}

export function countPhotos(category: PhotoCategory): number {
  return category.events.reduce((acc, e) => acc + e.photos.length, 0);
}

export type RecentPhoto = Photo & {
  categorySlug: string;
  categoryTitle: string;
  eventSlug: string;
  eventTitle: string;
};

export function getRecentPhotos(count = 3): RecentPhoto[] {
  const all: RecentPhoto[] = [];
  for (const cat of photoCategories) {
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

export type PhotoWithContext = Photo & {
  categoryTitle: string;
  eventTitle: string;
};

export function getPhotoById(id: string): PhotoWithContext | undefined {
  for (const cat of photoCategories) {
    for (const ev of cat.events) {
      for (const photo of ev.photos) {
        if (photo.id === id) {
          return {
            ...photo,
            categoryTitle: cat.title,
            eventTitle: ev.title,
          };
        }
      }
    }
  }
  return undefined;
}

/** Manifest metadata (for debugging / diagnostics). */
export const photoManifestMeta = {
  generatedAt: data.generatedAt,
  baseUrl: data.baseUrl,
  folderCount: folderArray.length,
};
