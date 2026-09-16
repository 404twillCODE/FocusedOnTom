import type { PersonalStatus, Place, PlaceType } from "./types";

export type ExploreFilters = {
  status: PersonalStatus | "all";
  types: PlaceType[];
  query: string;
  visitedOnly: boolean;
};

export function filterPlaces(places: Place[], filters: ExploreFilters): Place[] {
  return places.filter((place) => {
    if (filters.visitedOnly && place.personalStatus !== "visited") return false;
    if (filters.status !== "all" && place.personalStatus !== filters.status) {
      return false;
    }
    if (filters.types.length && !filters.types.includes(place.type)) {
      return false;
    }
    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      const hay = [place.name, place.county, place.region, place.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function placesToGeoJSON(places: Place[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((place) => ({
      type: "Feature" as const,
      id: place.id,
      geometry: {
        type: "Point" as const,
        coordinates: [place.longitude, place.latitude] as [number, number],
      },
      properties: {
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        personalStatus: place.personalStatus,
        county: place.county ?? "",
        region: place.region ?? "",
        coverImage: place.coverImage ?? "",
      },
    })),
  };
}
