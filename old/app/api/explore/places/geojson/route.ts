import { NextResponse } from "next/server";
import { queryPlacesGeoJSON } from "@/lib/explore/data";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const geojson = await queryPlacesGeoJSON({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      bbox: searchParams.get("bbox") ?? undefined,
    });
    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "GeoJSON query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
