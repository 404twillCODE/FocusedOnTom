import type { PlaceType } from "@/lib/explore/types";

export const DEC_BACKCOUNTRY_URL =
  "https://gisservices.dec.ny.gov/arcgis/rest/services/dec_backcountry_features/MapServer/0";

export const DEC_SOURCE_ID = "nys-dec-backcountry";

export const DEC_ASSET_TO_PLACE_TYPE: Record<string, PlaceType> = {
  "PRIMITIVE CAMPSITE": "primitive_campsite",
  "PRIMITIVE TENT SITE": "primitive_campsite",
  "LEAN-TO": "lean_to",
  "FIRE TOWER": "fire_tower",
  "UNPAVED PARKING LOT": "parking",
  "PAVED PARKING LOT": "parking",
  "SCENIC VISTA": "viewpoint",
  "FISHING ACCESS SITE": "fishing_access",
  "FISHING PIER": "fishing_access",
  "FISHING PLATFORM": "fishing_access",
  "PICNIC AREA": "picnic_area",
  "PICNIC TABLE": "picnic_area",
  "DAY USE AREA": "picnic_area",
  "OBSERVATION PLATFORM": "viewpoint",
  "OBSERVATION TOWER": "viewpoint",
  "VISITOR CENTER": "other",
};

export type DecImportDataset = "primitive_campsites" | "lean_tos";

export const DEC_DATASETS: Record<
  DecImportDataset,
  { label: string; assets: string[]; placeType: PlaceType }
> = {
  primitive_campsites: {
    label: "NYS DEC — Primitive Campsites",
    assets: ["PRIMITIVE CAMPSITE", "PRIMITIVE TENT SITE"],
    placeType: "primitive_campsite",
  },
  lean_tos: {
    label: "NYS DEC — Lean-tos",
    assets: ["LEAN-TO"],
    placeType: "lean_to",
  },
};

export function mapDecAssetToPlaceType(asset: string): PlaceType | null {
  return DEC_ASSET_TO_PLACE_TYPE[asset.trim().toUpperCase()] ?? null;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "place";
}

export function blank(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}
