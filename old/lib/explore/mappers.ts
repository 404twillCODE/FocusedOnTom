import type {
  Campsite,
  Collection,
  CommunityStatus,
  CommunitySubmission,
  FieldReport,
  Goal,
  Media,
  OfficialPlaceData,
  Place,
  PlaceType,
  Trip,
  Visit,
} from "./types";

export type PlaceRow = {
  id: string;
  slug: string;
  name: string;
  place_type: string;
  latitude: number;
  longitude: number;
  county: string | null;
  region: string | null;
  description: string | null;
  personal_status: Place["personalStatus"];
  last_personally_verified: string | null;
  official_source_id: string | null;
  official_source_record_id: string | null;
  managing_agency: string | null;
  official_website: string | null;
  access_info: string | null;
  amenities: string[] | null;
  regulations: string | null;
  cover_image: string | null;
  parent_place_id: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  official_sources?: {
    id: string;
    name: string;
    agency: string | null;
    source_url: string | null;
    last_imported_at: string | null;
  } | null;
  official_place_data?: OfficialPlaceDataRow[] | OfficialPlaceDataRow | null;
};

export type OfficialPlaceDataRow = {
  id: string;
  place_id: string;
  source_id: string;
  source_record_id: string;
  official_name: string | null;
  official_type: string | null;
  official_description: string | null;
  facility: string | null;
  asset: string | null;
  unit: string | null;
  accessibility: string | null;
  official_url: string | null;
  raw_properties_json: Record<string, unknown> | null;
  source_updated_at: string | null;
  last_imported_at: string | null;
};

function agencyType(agency?: string | null): Place["officialSource"] {
  if (!agency) return undefined;
  const upper = agency.toUpperCase();
  const type = upper.includes("DEC")
    ? "NYS_DEC"
    : upper.includes("PARK")
      ? "NYS_PARKS"
      : "OTHER";
  return { type, official: true };
}

export function mapOfficial(row: OfficialPlaceDataRow): OfficialPlaceData {
  return {
    id: row.id,
    placeId: row.place_id,
    sourceId: row.source_id,
    sourceRecordId: row.source_record_id,
    officialName: row.official_name ?? undefined,
    officialType: row.official_type ?? undefined,
    officialDescription: row.official_description ?? undefined,
    facility: row.facility ?? undefined,
    asset: row.asset ?? undefined,
    unit: row.unit ?? undefined,
    accessibility: row.accessibility ?? undefined,
    officialUrl: row.official_url ?? undefined,
    rawProperties: row.raw_properties_json ?? undefined,
    sourceUpdatedAt: row.source_updated_at ?? undefined,
    lastImportedAt: row.last_imported_at ?? undefined,
  };
}

export function mapPlace(row: PlaceRow): Place {
  const officialList = Array.isArray(row.official_place_data)
    ? row.official_place_data
    : row.official_place_data
      ? [row.official_place_data]
      : [];
  const official = officialList[0] ? mapOfficial(officialList[0]) : undefined;
  const source = row.official_sources;
  const officialSource = source
    ? {
        ...agencyType(source.agency),
        id: source.id,
        type: agencyType(source.agency)?.type ?? "OTHER",
        official: true as const,
        sourceId: row.official_source_record_id ?? undefined,
        sourceUrl: source.source_url ?? undefined,
        lastImportedAt: source.last_imported_at ?? undefined,
        name: source.name,
        agency: source.agency ?? undefined,
      }
    : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.place_type as PlaceType,
    latitude: row.latitude,
    longitude: row.longitude,
    county: row.county ?? undefined,
    region: row.region ?? undefined,
    personalStatus: row.personal_status,
    officialSource,
    officialPlaceData: official,
    officialSourceId: row.official_source_id ?? undefined,
    officialSourceRecordId: row.official_source_record_id ?? undefined,
    description: row.description ?? undefined,
    officialWebsite: row.official_website ?? undefined,
    managingAgency: row.managing_agency ?? undefined,
    accessInfo: row.access_info ?? undefined,
    amenities: row.amenities ?? undefined,
    regulations: row.regulations ?? undefined,
    lastPersonallyVerified: row.last_personally_verified ?? undefined,
    coverImage: row.cover_image ?? undefined,
    parentPlaceId: row.parent_place_id ?? undefined,
    isHidden: row.is_hidden,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVisit(row: {
  id: string;
  place_id: string;
  visited_at: string;
  trip_id: string | null;
  notes: string | null;
  weather: string | null;
  activities: string[] | null;
}): Visit {
  return {
    id: row.id,
    placeId: row.place_id,
    date: row.visited_at,
    tripId: row.trip_id ?? undefined,
    notes: row.notes ?? undefined,
    weather: row.weather ?? undefined,
    activities: row.activities ?? undefined,
  };
}

export function mapFieldReport(row: {
  place_id: string;
  access_difficulty: string | null;
  road_condition: string | null;
  walk_from_vehicle: string | null;
  site_condition: string | null;
  privacy_rating: string | null;
  shade_rating: string | null;
  ground_condition: string | null;
  water_nearby: string | null;
  cell_service: string | null;
  tent_suitability: string | null;
  rv_suitability: string | null;
  fishing_notes: string | null;
  photography_notes: string | null;
  wildlife_notes: string | null;
  general_notes: string | null;
  overall_rating: number | null;
  verified_at: string | null;
}): FieldReport {
  return {
    placeId: row.place_id,
    accessDifficulty: row.access_difficulty ?? undefined,
    roadCondition: row.road_condition ?? undefined,
    walkFromParking: row.walk_from_vehicle ?? undefined,
    siteCondition: row.site_condition ?? undefined,
    privacy: row.privacy_rating ?? undefined,
    shade: row.shade_rating ?? undefined,
    groundCondition: row.ground_condition ?? undefined,
    waterNearby: row.water_nearby ?? undefined,
    cellService: row.cell_service ?? undefined,
    tentSuitability: row.tent_suitability ?? undefined,
    rvSuitability: row.rv_suitability ?? undefined,
    fishingNotes: row.fishing_notes ?? undefined,
    photographyNotes: row.photography_notes ?? undefined,
    wildlifeObserved: row.wildlife_notes ?? undefined,
    overallRating: row.overall_rating ?? undefined,
    personalNotes: row.general_notes ?? undefined,
  };
}

export function mapTrip(row: {
  id: string;
  slug: string;
  title: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  cover_image: string | null;
  miles_traveled: number | null;
  activities: string[] | null;
  highlights: string[] | null;
}): Trip {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    description: row.description ?? undefined,
    coverImage: row.cover_image ?? undefined,
    milesTraveled: row.miles_traveled ?? undefined,
    activities: row.activities ?? undefined,
    highlights: row.highlights ?? undefined,
  };
}

export function mapCollection(row: {
  id: string;
  slug: string;
  title: string;
  description: string;
}): Collection {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
  };
}

export function mapMedia(row: {
  id: string;
  place_id: string | null;
  visit_id: string | null;
  trip_id: string | null;
  media_type: Media["kind"];
  storage_path: string | null;
  external_url: string | null;
  caption: string | null;
  alt: string | null;
  taken_at: string | null;
}): Media {
  const url = row.external_url || row.storage_path || "";
  return {
    id: row.id,
    kind: row.media_type,
    url,
    alt: row.alt || row.caption || "",
    caption: row.caption ?? undefined,
    date: row.taken_at ?? undefined,
    placeId: row.place_id ?? undefined,
    visitId: row.visit_id ?? undefined,
    tripId: row.trip_id ?? undefined,
  };
}

export function mapGoal(row: {
  id: string;
  title: string;
  status: Goal["status"];
  place_id: string | null;
  trip_id: string | null;
  completed_at: string | null;
  notes: string | null;
}): Goal {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    placeId: row.place_id ?? undefined,
    tripId: row.trip_id ?? undefined,
    completedAt: row.completed_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapCampsite(row: {
  id: string;
  place_id: string;
  loop: string | null;
  site_number: string;
  site_type: string | null;
  tent_suitable: boolean | null;
  rv_suitable: boolean | null;
  privacy: string | null;
  shade: string | null;
  electric: boolean | null;
  waterfront: boolean | null;
  notes: string | null;
  photos: string[] | null;
}): Campsite {
  return {
    id: row.id,
    placeId: row.place_id,
    loop: row.loop ?? undefined,
    number: row.site_number,
    siteType: row.site_type ?? undefined,
    tentSuitable: row.tent_suitable ?? undefined,
    rvSuitable: row.rv_suitable ?? undefined,
    privacy: row.privacy ?? undefined,
    shade: row.shade ?? undefined,
    electric: row.electric ?? undefined,
    waterfront: row.waterfront ?? undefined,
    notes: row.notes ?? undefined,
    photos: row.photos ?? undefined,
  };
}

export function mapCommunity(row: {
  id: string;
  place_id: string | null;
  submission_type: string;
  submitter_label: string | null;
  visit_date: string | null;
  content: string;
  moderation_status: CommunityStatus;
  created_at: string;
}): CommunitySubmission {
  const kind =
    row.submission_type === "photo" ||
    row.submission_type === "condition" ||
    row.submission_type === "correction" ||
    row.submission_type === "field_report"
      ? row.submission_type
      : "comment";
  return {
    id: row.id,
    placeId: row.place_id ?? undefined,
    username: row.submitter_label ?? "community",
    submittedAt: row.created_at,
    visitDate: row.visit_date ?? undefined,
    kind,
    body: row.content,
    status: row.moderation_status,
  };
}
