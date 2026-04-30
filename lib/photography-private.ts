// ---------------------------------------------------------------------------
// Server-side helpers for private client galleries.
//
// Private photos are emitted by the sync script under `privateFolders[]` in
// `lib/photography-manifest.json` and NEVER surface in the public folders/
// events arrays. We only look them up here, after a password check.
// ---------------------------------------------------------------------------

import manifest from "./photography-manifest.json";
import type { Photo } from "./photography";

type ManifestPrivatePhoto = {
  id: string;
  filename: string;
  originalFilename: string;
  original_key?: string;
  public_key?: string;
  path: string;
  url: string;
  width: number;
  height: number;
  folderPath?: string;
  private?: boolean;
};

type ManifestPrivateFolder = {
  path: string;
  slug: string;
  category: string;
  event: string;
  name: string;
  title: string;
  photoCount: number;
  cover?: string;
  photos: ManifestPrivatePhoto[];
};

type ManifestWithPrivate = {
  privateFolders?: ManifestPrivateFolder[];
};

const pf: ManifestPrivateFolder[] =
  (manifest as ManifestWithPrivate).privateFolders ?? [];

export type PrivateBundle = {
  slug: string;
  title: string;
  photos: Photo[];
  cover?: string;
};

function toPhoto(mp: ManifestPrivatePhoto, slug: string): Photo {
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
    id: mp.id,
    photo_id: mp.id,
    path: mp.path,
    original_key: mp.original_key,
    public_key: mp.public_key,
    categorySlug: "private",
    eventSlug: slug,
  };
}

/** Look up all private photos for the given slug (event folder name). */
export function getPrivateBundleBySlug(slug: string): PrivateBundle | null {
  const matching = pf.filter(
    (f) => f.slug === slug || f.event === slug
  );
  if (matching.length === 0) return null;

  const photos: Photo[] = [];
  let cover: string | undefined;
  let title: string | undefined;
  for (const folder of matching) {
    for (const mp of folder.photos) photos.push(toPhoto(mp, slug));
    if (!cover && folder.cover) cover = folder.cover;
    if (!title) title = folder.title;
  }
  if (photos.length === 0) return null;

  return {
    slug,
    title: title ?? slug,
    photos,
    cover,
  };
}

/** List all private slugs (for admin UI). */
export function listPrivateSlugs(): string[] {
  const seen = new Set<string>();
  for (const f of pf) seen.add(f.slug);
  return [...seen];
}
