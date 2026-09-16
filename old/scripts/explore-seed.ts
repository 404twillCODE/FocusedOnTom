import { loadLocalEnv } from "./load-env";
import { createClient } from "@supabase/supabase-js";
import {
  seedCampsites,
  seedCollectionPlaces,
  seedCollections,
  seedCommunity,
  seedFieldReports,
  seedGoals,
  seedMedia,
  seedPlaces,
  seedTripStops,
  seedTrips,
  seedVisits,
} from "../lib/explore/seed";

loadLocalEnv();

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function upsert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const parks = seedPlaces.filter((p) => p.officialSource?.type === "NYS_PARKS");
  const decish = seedPlaces.filter((p) => p.officialSource?.type === "NYS_DEC");

  await upsert(
    "places",
    seedPlaces.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      place_type: p.type,
      latitude: p.latitude,
      longitude: p.longitude,
      county: p.county ?? null,
      region: p.region ?? null,
      description: p.description ?? null,
      personal_status: p.personalStatus,
      last_personally_verified: p.lastPersonallyVerified ?? null,
      official_source_id:
        p.officialSource?.type === "NYS_PARKS"
          ? "nys-parks"
          : p.officialSource?.type === "NYS_DEC"
            ? "nys-dec-backcountry"
            : "phase1-seed",
      official_source_record_id: p.slug,
      managing_agency: p.managingAgency ?? null,
      official_website: p.officialWebsite ?? null,
      access_info: p.accessInfo ?? null,
      amenities: p.amenities ?? null,
      cover_image: p.coverImage ?? null,
      parent_place_id: p.parentPlaceId ?? null,
      is_hidden: false,
      seed_key: p.id,
    }))
  );

  const officialRows = [...parks, ...decish].map((p) => ({
    id: `seed-official-${p.id}`,
    place_id: p.id,
    source_id:
      p.officialSource?.type === "NYS_PARKS" ? "nys-parks" : "nys-dec-backcountry",
    source_record_id: p.slug,
    official_name: p.name,
    official_type: p.type,
    official_description: p.description ?? null,
    official_url: p.officialWebsite ?? p.officialSource?.sourceUrl ?? null,
    raw_properties_json: { seed: true, slug: p.slug },
    last_imported_at: p.updatedAt,
  }));
  if (officialRows.length) {
    const { error } = await supabase
      .from("official_place_data")
      .upsert(officialRows, { onConflict: "source_id,source_record_id" });
    if (error) throw new Error(`official_place_data: ${error.message}`);
  }

  await upsert(
    "trips",
    seedTrips.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      start_date: t.startDate,
      end_date: t.endDate ?? null,
      description: t.description ?? null,
      cover_image: t.coverImage ?? null,
      miles_traveled: t.milesTraveled ?? null,
      activities: t.activities ?? null,
      highlights: t.highlights ?? null,
    }))
  );

  await upsert(
    "trip_stops",
    seedTripStops.map((s) => ({
      id: s.id,
      trip_id: s.tripId,
      place_id: s.placeId,
      stop_order: s.order,
      notes: s.notes ?? null,
    }))
  );

  await upsert(
    "collections",
    seedCollections.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
    }))
  );

  const { error: cpErr } = await supabase
    .from("collection_places")
    .upsert(seedCollectionPlaces.map((cp) => ({
      collection_id: cp.collectionId,
      place_id: cp.placeId,
    })));
  if (cpErr) throw new Error(`collection_places: ${cpErr.message}`);

  await upsert(
    "visits",
    seedVisits.map((v) => ({
      id: v.id,
      place_id: v.placeId,
      visited_at: v.date,
      trip_id: v.tripId ?? null,
      notes: v.notes ?? null,
      weather: v.weather ?? null,
      activities: v.activities ?? null,
    }))
  );

  await upsert(
    "field_reports",
    seedFieldReports.map((r) => ({
      id: `field-${r.placeId}`,
      place_id: r.placeId,
      access_difficulty: r.accessDifficulty ?? null,
      road_condition: r.roadCondition ?? null,
      walk_from_vehicle: r.walkFromParking ?? null,
      site_condition: r.siteCondition ?? null,
      privacy_rating: r.privacy ?? null,
      shade_rating: r.shade ?? null,
      ground_condition: r.groundCondition ?? null,
      water_nearby: r.waterNearby ?? null,
      cell_service: r.cellService ?? null,
      tent_suitability: r.tentSuitability ?? null,
      rv_suitability: r.rvSuitability ?? null,
      fishing_notes: r.fishingNotes ?? null,
      photography_notes: r.photographyNotes ?? null,
      wildlife_notes: r.wildlifeObserved ?? null,
      general_notes: r.personalNotes ?? null,
      overall_rating: r.overallRating ?? null,
      verified_at: seedPlaces.find((p) => p.id === r.placeId)?.lastPersonallyVerified ?? null,
    }))
  );

  await upsert(
    "goals",
    seedGoals.map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      place_id: g.placeId ?? null,
      trip_id: g.tripId ?? null,
      completed_at: g.completedAt ?? null,
      notes: g.notes ?? null,
    }))
  );

  await upsert(
    "media",
    seedMedia.map((m, i) => ({
      id: m.id,
      place_id: m.placeId ?? null,
      visit_id: m.visitId ?? null,
      trip_id: m.tripId ?? null,
      media_type: m.kind,
      storage_path: m.url.startsWith("/") ? m.url : null,
      external_url: m.url.startsWith("/") ? m.url : m.url,
      caption: m.caption ?? null,
      alt: m.alt,
      taken_at: m.date ?? null,
      sort_order: i,
    }))
  );

  await upsert(
    "park_campsites",
    seedCampsites.map((s) => ({
      id: s.id,
      place_id: s.placeId,
      loop: s.loop ?? null,
      site_number: s.number,
      site_type: s.siteType ?? null,
      tent_suitable: s.tentSuitable ?? null,
      rv_suitable: s.rvSuitable ?? null,
      privacy: s.privacy ?? null,
      shade: s.shade ?? null,
      electric: s.electric ?? null,
      waterfront: s.waterfront ?? null,
      notes: s.notes ?? null,
      photos: s.photos ?? null,
    }))
  );

  await upsert(
    "community_submissions",
    seedCommunity.map((c) => ({
      id: c.id,
      place_id: c.placeId ?? null,
      submission_type: c.kind,
      submitter_label: c.username,
      visit_date: c.visitDate ?? null,
      content: c.body,
      moderation_status: c.status,
      created_at: c.submittedAt,
    }))
  );

  console.log(`Seeded ${seedPlaces.length} places, ${seedTrips.length} trips, ${seedCollections.length} collections.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
