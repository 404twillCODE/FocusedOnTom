export const PLACE_TYPES = [
  "state_park",
  "dec_land",
  "primitive_campsite",
  "campsite",
  "lean_to",
  "fire_tower",
  "trail",
  "trailhead",
  "parking",
  "boat_launch",
  "hand_launch",
  "fishing_access",
  "viewpoint",
  "waterfall",
  "lake",
  "beach",
  "picnic_area",
  "historic_site",
  "wildlife",
  "other",
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export type PersonalStatus = "unvisited" | "want_to_visit" | "visited";

export type GoalStatus = "pending" | "completed";

export type MediaKind = "photo" | "video" | "youtube";

export type CommunityStatus = "pending" | "approved" | "rejected";

export type OfficialSource = {
  id?: string;
  type: "NYS_DEC" | "NYS_PARKS" | "OTHER";
  sourceId?: string;
  sourceUrl?: string;
  lastImportedAt?: string;
  official: true;
  name?: string;
  agency?: string;
};

export type OfficialPlaceData = {
  id: string;
  placeId: string;
  sourceId: string;
  sourceRecordId: string;
  officialName?: string;
  officialType?: string;
  officialDescription?: string;
  facility?: string;
  asset?: string;
  unit?: string;
  accessibility?: string;
  officialUrl?: string;
  rawProperties?: Record<string, unknown>;
  sourceUpdatedAt?: string;
  lastImportedAt?: string;
};

export type Place = {
  id: string;
  slug: string;
  name: string;
  type: PlaceType;
  latitude: number;
  longitude: number;
  county?: string;
  region?: string;
  personalStatus: PersonalStatus;
  officialSource?: OfficialSource;
  officialPlaceData?: OfficialPlaceData;
  officialSourceId?: string;
  officialSourceRecordId?: string;
  description?: string;
  officialWebsite?: string;
  managingAgency?: string;
  accessInfo?: string;
  amenities?: string[];
  regulations?: string;
  lastPersonallyVerified?: string;
  coverImage?: string;
  parentPlaceId?: string;
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FieldReport = {
  placeId: string;
  accessDifficulty?: string;
  roadCondition?: string;
  walkFromParking?: string;
  siteCondition?: string;
  privacy?: string;
  shade?: string;
  groundCondition?: string;
  waterNearby?: string;
  cellService?: string;
  tentSuitability?: string;
  rvSuitability?: string;
  fishingNotes?: string;
  photographyNotes?: string;
  wildlifeObserved?: string;
  overallRating?: number;
  personalNotes?: string;
};

export type Visit = {
  id: string;
  placeId: string;
  date: string;
  notes?: string;
  weather?: string;
  activities?: string[];
  tripId?: string;
  goalsCompleted?: string[];
};

export type Trip = {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  coverImage?: string;
  milesTraveled?: number;
  activities?: string[];
  highlights?: string[];
};

export type TripStop = {
  id: string;
  tripId: string;
  placeId: string;
  order: number;
  notes?: string;
};

export type Media = {
  id: string;
  kind: MediaKind;
  url: string;
  alt: string;
  caption?: string;
  date?: string;
  placeId?: string;
  visitId?: string;
  tripId?: string;
};

export type Goal = {
  id: string;
  title: string;
  status: GoalStatus;
  placeId?: string;
  tripId?: string;
  completedAt?: string;
  notes?: string;
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

export type CollectionPlace = {
  collectionId: string;
  placeId: string;
};

export type Campsite = {
  id: string;
  placeId: string;
  loop?: string;
  number: string;
  siteType?: string;
  tentSuitable?: boolean;
  rvSuitable?: boolean;
  privacy?: string;
  shade?: string;
  electric?: boolean;
  waterfront?: boolean;
  notes?: string;
  photos?: string[];
};

export type CommunitySubmission = {
  id: string;
  placeId?: string;
  username: string;
  submittedAt: string;
  visitDate?: string;
  kind: "photo" | "condition" | "correction" | "comment" | "field_report";
  body: string;
  status: CommunityStatus;
};

export type ExploreUser = {
  id: string;
  username: string;
  role: "owner" | "community";
};

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  state_park: "New York State Park",
  dec_land: "DEC land",
  primitive_campsite: "Primitive campsite",
  campsite: "Developed campsite",
  lean_to: "Lean-to",
  fire_tower: "Fire tower",
  trail: "Trail",
  trailhead: "Trailhead",
  parking: "Parking / trailhead",
  boat_launch: "Boat launch",
  hand_launch: "Hand launch",
  fishing_access: "Fishing access",
  viewpoint: "Scenic viewpoint",
  waterfall: "Waterfall",
  lake: "Lake / pond",
  beach: "Beach",
  picnic_area: "Picnic area",
  historic_site: "Historic site",
  wildlife: "Wildlife location",
  other: "Outdoor point of interest",
};

export const STATUS_LABELS: Record<PersonalStatus, string> = {
  unvisited: "Unvisited",
  want_to_visit: "Want to Visit",
  visited: "Visited",
};

export const NY_BOUNDS = {
  west: -79.85,
  south: 40.48,
  east: -71.78,
  north: 45.07,
} as const;

export const NY_CENTER: [number, number] = [-75.5, 42.95];
