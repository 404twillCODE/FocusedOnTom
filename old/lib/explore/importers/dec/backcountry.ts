import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { featurePoint, fetchArcGisGeoJSON } from "../arcgis";
import { isInsideAdirondack, loadAdirondackBoundary } from "../geo";
import {
  blank,
  DEC_BACKCOUNTRY_URL,
  DEC_DATASETS,
  DEC_SOURCE_ID,
  mapDecAssetToPlaceType,
  slugify,
  type DecImportDataset,
} from "./types";

export type ImportResult = {
  logId: string;
  status: "success" | "partial" | "failed";
  recordsReceived: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errorMessage?: string;
};

type ExistingOfficial = {
  id: string;
  place_id: string;
};

export async function importDecBackcountry(
  dataset: DecImportDataset,
  options?: { adirondackOnly?: boolean }
): Promise<ImportResult> {
  const adirondackOnly = options?.adirondackOnly ?? true;
  const spec = DEC_DATASETS[dataset];
  const supabase = createServiceSupabaseClient();

  const { data: logRow, error: logErr } = await supabase
    .from("import_logs")
    .insert({
      source_id: DEC_SOURCE_ID,
      status: "running",
      metadata_json: { dataset, adirondackOnly, assets: spec.assets },
    })
    .select("id")
    .single();
  if (logErr || !logRow) {
    throw logErr ?? new Error("Could not create import log");
  }
  const logId = logRow.id as string;

  const counts = {
    recordsReceived: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
  };
  const failures: Array<{ id?: string; reason: string }> = [];

  try {
    const where = `ASSET IN (${spec.assets.map((a) => `'${a.replace(/'/g, "''")}'`).join(",")})`;
    const features = await fetchArcGisGeoJSON(DEC_BACKCOUNTRY_URL, {
      where,
      outFields: "*",
    });
    counts.recordsReceived = features.length;

    const boundary = adirondackOnly ? await loadAdirondackBoundary() : null;

    const { data: existingRows, error: existingErr } = await supabase
      .from("official_place_data")
      .select("id, place_id, source_record_id")
      .eq("source_id", DEC_SOURCE_ID);
    if (existingErr) throw existingErr;
    const existingByRecord = new Map<string, ExistingOfficial>(
      (existingRows ?? []).map((row) => [
        row.source_record_id as string,
        { id: row.id as string, place_id: row.place_id as string },
      ])
    );

    for (const feature of features) {
      try {
        const props = feature.properties ?? {};
        const coords = featurePoint(feature);
        if (!coords) {
          counts.recordsSkipped += 1;
          failures.push({ reason: "missing coordinates" });
          continue;
        }
        if (boundary && !isInsideAdirondack(coords.longitude, coords.latitude, boundary)) {
          counts.recordsSkipped += 1;
          continue;
        }

        const asset = blank(props.ASSET) ?? "";
        const placeType = mapDecAssetToPlaceType(asset);
        if (!placeType || !spec.assets.includes(asset.toUpperCase())) {
          counts.recordsSkipped += 1;
          continue;
        }

        const objectId = blank(props.OBJECTID) ?? blank(feature.id);
        const assetUid = blank(props.ASSET_UID);
        const sourceRecordId = assetUid || objectId;
        if (!sourceRecordId) {
          counts.recordsFailed += 1;
          failures.push({ reason: "missing source ID" });
          continue;
        }

        const officialName = blank(props.NAME) || `${spec.placeType} ${sourceRecordId}`;
        const existing = existingByRecord.get(sourceRecordId);
        const now = new Date().toISOString();
        const officialPayload = {
          source_id: DEC_SOURCE_ID,
          source_record_id: sourceRecordId,
          official_name: officialName,
          official_type: asset,
          official_description: blank(props.DESCRIP) ?? blank(props.NOTES),
          facility: blank(props.FACILITY),
          asset,
          unit: blank(props.UNIT),
          accessibility: blank(props.ACCESSIBLE),
          official_url: blank(props.PHOTO_LINK),
          raw_properties_json: props,
          source_updated_at: toIso(props.UPDATED),
          last_imported_at: now,
        };

        if (existing) {
          const { error: officialErr } = await supabase
            .from("official_place_data")
            .update(officialPayload)
            .eq("id", existing.id);
          if (officialErr) throw officialErr;

          // Official fields only — never touch personal_status, visits, media, goals, etc.
          const { error: placeErr } = await supabase
            .from("places")
            .update({
              name: officialName,
              latitude: coords.latitude,
              longitude: coords.longitude,
              region: regionFromUnit(blank(props.UNIT), blank(props.REGION)),
              official_source_id: DEC_SOURCE_ID,
              official_source_record_id: sourceRecordId,
              managing_agency: "NYS DEC",
            })
            .eq("id", existing.place_id);
          if (placeErr) throw placeErr;
          counts.recordsUpdated += 1;
        } else {
          const placeId = `dec-bc-${sourceRecordId}`;
          const slug = `${slugify(officialName)}-${sourceRecordId}`;
          const { error: placeErr } = await supabase.from("places").insert({
            id: placeId,
            slug,
            name: officialName,
            place_type: placeType,
            latitude: coords.latitude,
            longitude: coords.longitude,
            region: regionFromUnit(blank(props.UNIT), blank(props.REGION)),
            personal_status: "unvisited",
            official_source_id: DEC_SOURCE_ID,
            official_source_record_id: sourceRecordId,
            managing_agency: "NYS DEC",
            is_hidden: false,
          });
          if (placeErr) throw placeErr;
          const { error: officialErr } = await supabase.from("official_place_data").insert({
            ...officialPayload,
            place_id: placeId,
          });
          if (officialErr) throw officialErr;
          existingByRecord.set(sourceRecordId, { id: "new", place_id: placeId });
          counts.recordsCreated += 1;
        }
      } catch (err) {
        counts.recordsFailed += 1;
        failures.push({
          id: String(feature.properties?.OBJECTID ?? feature.id ?? ""),
          reason: err instanceof Error ? err.message : "unknown feature error",
        });
      }
    }

    const status =
      counts.recordsFailed > 0 && counts.recordsCreated + counts.recordsUpdated === 0
        ? "failed"
        : counts.recordsFailed > 0
          ? "partial"
          : "success";

    await supabase
      .from("official_sources")
      .update({ last_imported_at: new Date().toISOString() })
      .eq("id", DEC_SOURCE_ID);

    await supabase
      .from("import_logs")
      .update({
        finished_at: new Date().toISOString(),
        status,
        ...counts,
        error_message: failures.slice(0, 20).map((f) => f.reason).join("; ") || null,
        metadata_json: {
          dataset,
          adirondackOnly,
          assets: spec.assets,
          failures: failures.slice(0, 50),
        },
      })
      .eq("id", logId);

    return { logId, status, ...counts };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    await supabase
      .from("import_logs")
      .update({
        finished_at: new Date().toISOString(),
        status: "failed",
        ...counts,
        error_message: message,
      })
      .eq("id", logId);
    return { logId, status: "failed", ...counts, errorMessage: message };
  }
}

function toIso(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function regionFromUnit(unit?: string, region?: string) {
  if (unit === "AFP" || unit === "ADK") return "Adirondacks";
  if (region) return `DEC Region ${region}`;
  return unit;
}
