export type Photo = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  name?: string;
  date?: string;
  capturedAt?: string | null;
  width?: number;
  height?: number;
  section?: string;
  displayOrder?: number;
  camera?: string;
  lens?: string;
  settings?: string;
  techCaption?: string;
  buyUrl?: string;
  sourceUrl?: string;
};
export type Collection = {
  id: string;
  name: string;
  category: string;
  photos: Photo[];
  totalPhotos: number;
  coverUrl?: string;
  sourceUrl?: string;
};
export function safeUrl(raw?: string) {
  try {
    const origin =
      typeof location === "undefined"
        ? "https://focusedontom.com"
        : location.origin;
    const url = new URL(raw || "", origin);
    return url.protocol === "https:" || url.origin === origin ? url.href : "";
  } catch {
    return "";
  }
}
function collectionDate(collection: Collection) {
  return collection.photos.reduce((latest, photo) => {
    const captured = Date.parse(photo.capturedAt || "");
    const date = Number.isFinite(captured) ? captured : Date.parse(photo.date || "");
    return Number.isFinite(date) ? Math.max(latest, date) : latest;
  }, 0);
}
export function normalizeCatalog(value: unknown): Collection[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("collections" in value) ||
    !Array.isArray(value.collections)
  )
    throw new Error("Unavailable catalog");
  return value.collections
    .filter((collection): collection is Collection =>
      Boolean(
        collection?.id &&
        collection?.name &&
        Array.isArray(collection?.photos) &&
        collection.photos.length,
      ),
    )
    .map((collection) => ({
      ...collection,
      category: collection.category || "Photography",
      totalPhotos: collection.totalPhotos || collection.photos.length,
      photos: collection.photos.filter(
        (photo) => photo.id && safeUrl(photo.url),
      ),
    }))
    .sort((a, b) =>
      collectionDate(b) - collectionDate(a) ||
      a.name.localeCompare(b.name, "en", { numeric: true }) || a.id.localeCompare(b.id),
    );
}
export function groupAlbumPhotos(photos: Photo[]) {
  const groups = new Map<string, Photo[]>();
  for (const photo of [...photos].sort(
    (a, b) =>
      (Number.isFinite(a.displayOrder) ? a.displayOrder! : Infinity) -
      (Number.isFinite(b.displayOrder) ? b.displayOrder! : Infinity),
  )) {
    const name = photo.section?.trim() || "";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(photo);
  }
  return [...groups].map(([name, photos]) => ({ name, photos }));
}
