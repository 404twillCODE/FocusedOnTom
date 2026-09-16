import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { fetchArcGisGeoJSON } from "./arcgis";

export const ADIRONDACK_BOUNDARY_ID = "adirondack_park";
export const ADIRONDACK_SOURCE_URL =
  "https://services2.arcgis.com/8krRUWgifzA4cgL3/ArcGIS/rest/services/BluelinePolygon/FeatureServer/0";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type BoundaryRow = {
  geojson: Feature<Polygon | MultiPolygon> | { type: "FeatureCollection"; features: Feature[] };
  fetched_at: string;
};

export async function loadAdirondackBoundary(forceRefresh = false) {
  const supabase = createServiceSupabaseClient();
  if (!forceRefresh) {
    const { data } = await supabase
      .from("geo_boundaries")
      .select("geojson, fetched_at")
      .eq("id", ADIRONDACK_BOUNDARY_ID)
      .maybeSingle();
    const row = data as BoundaryRow | null;
    if (row?.geojson && Date.now() - new Date(row.fetched_at).getTime() < MAX_AGE_MS) {
      return asPolygonFeature(row.geojson);
    }
  }

  const features = await fetchArcGisGeoJSON(ADIRONDACK_SOURCE_URL, {
    where: "1=1",
    outFields: "*",
  });
  const poly = features.find(
    (f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
  );
  if (!poly?.geometry) {
    throw new Error("Adirondack Park polygon was not returned by the APA GIS service.");
  }
  const feature = {
    type: "Feature" as const,
    properties: poly.properties ?? {},
    geometry: poly.geometry as Polygon | MultiPolygon,
  };
  const { error } = await supabase.from("geo_boundaries").upsert({
    id: ADIRONDACK_BOUNDARY_ID,
    name: "Adirondack Park Boundary (Blueline)",
    source_url: ADIRONDACK_SOURCE_URL,
    geojson: feature,
    fetched_at: new Date().toISOString(),
  });
  if (error) throw error;
  return feature;
}

function asPolygonFeature(
  geojson: BoundaryRow["geojson"]
): Feature<Polygon | MultiPolygon> {
  if (geojson.type === "FeatureCollection") {
    const feat = geojson.features.find(
      (f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
    );
    if (!feat) throw new Error("Stored Adirondack boundary has no polygon.");
    return feat as Feature<Polygon | MultiPolygon>;
  }
  return geojson as Feature<Polygon | MultiPolygon>;
}

export function isInsideAdirondack(
  longitude: number,
  latitude: number,
  boundary: Feature<Polygon | MultiPolygon>
) {
  return booleanPointInPolygon(point([longitude, latitude]), boundary);
}
