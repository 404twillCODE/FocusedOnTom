export type ArcGisFeature = {
  type: "Feature";
  id?: number | string;
  geometry: {
    type: string;
    coordinates: unknown;
  } | null;
  properties: Record<string, unknown> | null;
};

export type ArcGisFeatureCollection = {
  type: "FeatureCollection";
  features: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  properties?: { exceededTransferLimit?: boolean };
};

const PAGE_SIZE = 1000;

export async function fetchArcGisGeoJSON(
  url: string,
  params: Record<string, string>
): Promise<ArcGisFeature[]> {
  const features: ArcGisFeature[] = [];
  let offset = 0;
  for (;;) {
    const search = new URLSearchParams({
      f: "geojson",
      outSR: "4326",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      ...params,
    });
    const res = await fetch(`${url}/query?${search.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`GIS request failed (${res.status}) for ${url}`);
    }
    const body = (await res.json()) as ArcGisFeatureCollection & {
      error?: { message?: string };
    };
    if (body.error?.message) {
      throw new Error(`GIS error: ${body.error.message}`);
    }
    const page = body.features ?? [];
    features.push(...page);
    const exceeded =
      body.exceededTransferLimit || body.properties?.exceededTransferLimit;
    if (page.length < PAGE_SIZE && !exceeded) break;
    if (page.length === 0) break;
    offset += page.length;
    if (offset > 100_000) break;
  }
  return features;
}

export function featurePoint(
  feature: ArcGisFeature
): { longitude: number; latitude: number } | null {
  const geom = feature.geometry;
  if (!geom || geom.type !== "Point" || !Array.isArray(geom.coordinates)) {
    return null;
  }
  const [longitude, latitude] = geom.coordinates as [unknown, unknown];
  if (typeof longitude !== "number" || typeof latitude !== "number") return null;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return { longitude, latitude };
}
