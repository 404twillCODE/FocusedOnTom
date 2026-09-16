import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { placesToGeoJSON } from "./geojson";
import type { Place, PlaceType } from "./types";
import {
  mapCampsite,
  mapCollection,
  mapCommunity,
  mapFieldReport,
  mapGoal,
  mapMedia,
  mapPlace,
  mapTrip,
  mapVisit,
  type PlaceRow,
} from "./mappers";

const PLACE_SELECT = `
  *,
  official_sources (*),
  official_place_data (*)
`;

function throwIfError(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "PGRST205" || /schema cache|does not exist/i.test(error.message)) {
    return "missing";
  }
  throw error;
}

async function publicClient() {
  return createServerSupabaseClient();
}

export async function getPlaces(options?: { includeHidden?: boolean }): Promise<Place[]> {
  const supabase = options?.includeHidden
    ? createServiceSupabaseClient()
    : await publicClient();
  let query = supabase
    .from("places")
    .select(PLACE_SELECT)
    .is("merge_into_place_id", null)
    .order("name");
  if (!options?.includeHidden) {
    query = query.eq("is_hidden", false);
  }
  const { data, error } = await query;
  if (throwIfError(error) === "missing") return [];
  return (data as PlaceRow[]).map(mapPlace);
}

export async function getPlaceBySlug(
  slug: string,
  options?: { includeHidden?: boolean }
): Promise<Place | undefined> {
  const supabase = options?.includeHidden
    ? createServiceSupabaseClient()
    : await publicClient();
  let query = supabase.from("places").select(PLACE_SELECT).eq("slug", slug);
  if (!options?.includeHidden) query = query.eq("is_hidden", false);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapPlace(data as PlaceRow) : undefined;
}

export async function getPlaceById(
  id: string,
  options?: { includeHidden?: boolean }
): Promise<Place | undefined> {
  const supabase = options?.includeHidden
    ? createServiceSupabaseClient()
    : await publicClient();
  const { data, error } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const place = mapPlace(data as PlaceRow);
  if (!options?.includeHidden && place.isHidden) return undefined;
  return place;
}

export async function getVisitsForPlace(placeId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("place_id", placeId)
    .order("visited_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapVisit);
}

export async function getMediaForPlace(placeId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("place_id", placeId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapMedia);
}

export async function getGoalsForPlace(placeId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("place_id", placeId);
  if (error) throw error;
  return (data ?? []).map(mapGoal);
}

export async function getFieldReport(placeId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("field_reports")
    .select("*")
    .eq("place_id", placeId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFieldReport(data) : undefined;
}

export async function getCampsites(placeId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("park_campsites")
    .select("*")
    .eq("place_id", placeId)
    .order("site_number");
  if (error) throw error;
  return (data ?? []).map(mapCampsite);
}

export async function getTrips() {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTrip);
}

export async function getTripBySlug(slug: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTrip(data) : undefined;
}

export async function getStopsForTrip(tripId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("stop_order");
  if (error) throw error;
  const stops = data ?? [];
  const result = [];
  for (const stop of stops) {
    const place = await getPlaceById(stop.place_id);
    result.push({
      id: stop.id,
      tripId: stop.trip_id,
      placeId: stop.place_id,
      order: stop.stop_order,
      notes: stop.notes ?? undefined,
      place,
    });
  }
  return result;
}

export async function getMediaForTrip(tripId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapMedia);
}

export async function getGoalsForTrip(tripId: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("trip_id", tripId);
  if (error) throw error;
  return (data ?? []).map(mapGoal);
}

export async function getCollections() {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("title");
  if (error) throw error;
  return (data ?? []).map(mapCollection);
}

export async function getCollectionBySlug(slug: string) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCollection(data) : undefined;
}

export async function getPlacesForCollection(collectionId: string): Promise<Place[]> {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("collection_places")
    .select("place_id")
    .eq("collection_id", collectionId);
  if (error) throw error;
  const ids = (data ?? []).map((row) => row.place_id as string);
  const places: Place[] = [];
  for (const id of ids) {
    const place = await getPlaceById(id);
    if (place) places.push(place);
  }
  return places;
}

export async function collectionProgress(collectionId: string) {
  const places = await getPlacesForCollection(collectionId);
  const completed = places.filter((p) => p.personalStatus === "visited").length;
  return {
    total: places.length,
    completed,
    percent: places.length ? Math.round((completed / places.length) * 100) : 0,
  };
}

export async function getCommunitySubmissions(options?: { includePending?: boolean }) {
  const supabase = options?.includePending
    ? createServiceSupabaseClient()
    : await publicClient();
  const { data, error } = await supabase
    .from("community_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (throwIfError(error) === "missing") return [];
  return (data ?? []).map(mapCommunity);
}

export async function searchExplore(query: string) {
  const q = query.trim();
  if (!q) return { places: [] as Place[], trips: [], collections: [] };
  const supabase = await publicClient();
  const like = `%${q}%`;
  const [placesRes, tripsRes, collectionsRes] = await Promise.all([
    supabase
      .from("places")
      .select(PLACE_SELECT)
      .eq("is_hidden", false)
      .or(`name.ilike.${like},county.ilike.${like},region.ilike.${like},slug.ilike.${like}`),
    supabase.from("trips").select("*").or(`title.ilike.${like},description.ilike.${like}`),
    supabase.from("collections").select("*").or(`title.ilike.${like},description.ilike.${like}`),
  ]);
  if (placesRes.error) throw placesRes.error;
  if (tripsRes.error) throw tripsRes.error;
  if (collectionsRes.error) throw collectionsRes.error;
  return {
    places: (placesRes.data as PlaceRow[]).map(mapPlace),
    trips: (tripsRes.data ?? []).map(mapTrip),
    collections: (collectionsRes.data ?? []).map(mapCollection),
  };
}

export type { ExploreFilters } from "./geojson";
export { filterPlaces, placesToGeoJSON } from "./geojson";

export async function getExploreStats() {
  const supabase = await publicClient();
  const [{ data: places, error: pErr }, { data: visits, error: vErr }, { data: media, error: mErr }, { data: trips, error: tErr }] =
    await Promise.all([
      supabase.from("places").select("place_type, personal_status").eq("is_hidden", false),
      supabase.from("visits").select("activities"),
      supabase.from("media").select("id, media_type"),
      supabase.from("trips").select("miles_traveled"),
    ]);
  if (pErr) throw pErr;
  if (vErr) throw vErr;
  if (mErr) throw mErr;
  if (tErr) throw tErr;
  const list = places ?? [];
  const visited = list.filter((p) => p.personal_status === "visited");
  const nights = (visits ?? []).filter((v) =>
    (v.activities ?? []).includes("Camping")
  ).length;
  return {
    placesVisited: visited.length,
    placesTotal: list.length,
    wantToVisit: list.filter((p) => p.personal_status === "want_to_visit").length,
    stateParksVisited: visited.filter((p) => p.place_type === "state_park").length,
    fireTowersVisited: visited.filter((p) => p.place_type === "fire_tower").length,
    primitiveCampsites: visited.filter((p) => p.place_type === "primitive_campsite").length,
    nightsCamped: nights,
    boatLaunches: visited.filter((p) => p.place_type === "boat_launch").length,
    lakesVisited: visited.filter((p) => p.place_type === "lake").length,
    fishingAccess: visited.filter((p) => p.place_type === "fishing_access").length,
    photos: (media ?? []).filter((m) => m.media_type === "photo").length,
    trips: (trips ?? []).length,
    milesTraveled: (trips ?? []).reduce(
      (sum, t) => sum + Number(t.miles_traveled ?? 0),
      0
    ),
  };
}

export async function getLatestTrip() {
  const trips = await getTrips();
  return trips[0];
}

export async function getRecentPhotos(limit = 4) {
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("media_type", "photo")
    .order("taken_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapMedia);
}

export async function queryPlacesGeoJSON(params: {
  status?: string;
  type?: string;
  source?: string;
  bbox?: string;
  includeHidden?: boolean;
}) {
  const supabase = params.includeHidden
    ? createServiceSupabaseClient()
    : await publicClient();
  let query = supabase
    .from("places")
    .select(
      "id, slug, name, place_type, latitude, longitude, county, region, personal_status, cover_image, official_source_id"
    )
    .is("merge_into_place_id", null);
  if (!params.includeHidden) query = query.eq("is_hidden", false);
  if (params.status && params.status !== "all") {
    query = query.eq("personal_status", params.status);
  }
  if (params.type) {
    const types = params.type.split(",").map((t) => t.trim()).filter(Boolean);
    if (types.length === 1) query = query.eq("place_type", types[0]);
    else if (types.length > 1) query = query.in("place_type", types);
  }
  if (params.source) query = query.eq("official_source_id", params.source);
  if (params.bbox) {
    const [west, south, east, north] = params.bbox.split(",").map(Number);
    if ([west, south, east, north].every((n) => Number.isFinite(n))) {
      query = query
        .gte("longitude", west)
        .lte("longitude", east)
        .gte("latitude", south)
        .lte("latitude", north);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  const places: Place[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.place_type as PlaceType,
    latitude: row.latitude,
    longitude: row.longitude,
    county: row.county ?? undefined,
    region: row.region ?? undefined,
    personalStatus: row.personal_status,
    coverImage: row.cover_image ?? undefined,
    officialSourceId: row.official_source_id ?? undefined,
    createdAt: "",
    updatedAt: "",
  }));
  return placesToGeoJSON(places);
}
