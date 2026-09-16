"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { requireExploreAdmin } from "@/lib/explore/auth";
import type { PersonalStatus } from "@/lib/explore/types";

async function admin() {
  const user = await requireExploreAdmin();
  if (!user) throw new Error("Unauthorized");
  return { user, supabase: createServiceSupabaseClient() };
}

export async function updatePlaceStatus(placeId: string, status: PersonalStatus) {
  const { supabase } = await admin();
  const { error } = await supabase
    .from("places")
    .update({ personal_status: status })
    .eq("id", placeId);
  if (error) throw error;
  revalidatePath("/explore");
  revalidatePath("/explore/admin");
  revalidatePath("/explore/places");
}

export async function hidePlace(placeId: string, hidden: boolean) {
  const { supabase } = await admin();
  const { error } = await supabase
    .from("places")
    .update({ is_hidden: hidden })
    .eq("id", placeId);
  if (error) throw error;
  revalidatePath("/explore");
  revalidatePath("/explore/admin");
}

export async function addVisit(formData: FormData) {
  const { supabase } = await admin();
  const placeId = String(formData.get("placeId") ?? "");
  const visitedAt = String(formData.get("visitedAt") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  const weather = String(formData.get("weather") ?? "") || null;
  const activities = String(formData.get("activities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!placeId || !visitedAt) throw new Error("Place and date required");
  const { error } = await supabase.from("visits").insert({
    id: `visit-${placeId}-${visitedAt}`,
    place_id: placeId,
    visited_at: visitedAt,
    notes,
    weather,
    activities: activities.length ? activities : null,
  });
  if (error) throw error;
  await supabase
    .from("places")
    .update({
      personal_status: "visited",
      last_personally_verified: visitedAt,
    })
    .eq("id", placeId);
  revalidatePath("/explore");
  revalidatePath(`/explore/admin/places/${placeId}`);
}

export async function upsertFieldReport(formData: FormData) {
  const { supabase } = await admin();
  const placeId = String(formData.get("placeId") ?? "");
  if (!placeId) throw new Error("Missing place");
  const payload = {
    id: `field-${placeId}`,
    place_id: placeId,
    access_difficulty: String(formData.get("accessDifficulty") ?? "") || null,
    road_condition: String(formData.get("roadCondition") ?? "") || null,
    walk_from_vehicle: String(formData.get("walkFromVehicle") ?? "") || null,
    site_condition: String(formData.get("siteCondition") ?? "") || null,
    privacy_rating: String(formData.get("privacy") ?? "") || null,
    shade_rating: String(formData.get("shade") ?? "") || null,
    ground_condition: String(formData.get("groundCondition") ?? "") || null,
    water_nearby: String(formData.get("waterNearby") ?? "") || null,
    cell_service: String(formData.get("cellService") ?? "") || null,
    tent_suitability: String(formData.get("tentSuitability") ?? "") || null,
    rv_suitability: String(formData.get("rvSuitability") ?? "") || null,
    fishing_notes: String(formData.get("fishingNotes") ?? "") || null,
    photography_notes: String(formData.get("photographyNotes") ?? "") || null,
    wildlife_notes: String(formData.get("wildlifeNotes") ?? "") || null,
    general_notes: String(formData.get("generalNotes") ?? "") || null,
    verified_at: String(formData.get("verifiedAt") ?? "") || null,
  };
  const { error } = await supabase.from("field_reports").upsert(payload);
  if (error) throw error;
  revalidatePath(`/explore/places`);
  revalidatePath(`/explore/admin/places/${placeId}`);
}

export async function addGoal(formData: FormData) {
  const { supabase } = await admin();
  const placeId = String(formData.get("placeId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!placeId || !title) throw new Error("Title required");
  const { error } = await supabase.from("goals").insert({
    id: `goal-${placeId}-${Date.now()}`,
    title,
    status: "pending",
    place_id: placeId,
  });
  if (error) throw error;
  revalidatePath(`/explore/admin/places/${placeId}`);
}

export async function reviewCommunity(id: string, status: "approved" | "rejected") {
  const { user, supabase } = await admin();
  const { error } = await supabase
    .from("community_submissions")
    .update({
      moderation_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/explore/admin");
  revalidatePath("/explore/community");
}
