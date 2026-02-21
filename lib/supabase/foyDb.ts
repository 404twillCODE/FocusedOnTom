import type { SupabaseClient } from "@supabase/supabase-js";

export type FOYOnboardingGoal = "lose_weight" | "build_muscle" | "balanced";
export type FOYOnboardingEquipment = "planet_fitness" | "home" | "both";
export type FOYOnboardingStyle = "minimal" | "balanced" | "detailed";

export type FOYUserSettings = {
  id: string;
  units: string;
  theme_preference: string | null;
  rest_timer_default_seconds: number;
  onboarding_completed: boolean;
  onboarding_goal: FOYOnboardingGoal | null;
  onboarding_schedule_days: number | null;
  onboarding_equipment: FOYOnboardingEquipment | null;
  onboarding_style: FOYOnboardingStyle | null;
};

export type FOYUserSettingsUpdate = Partial<{
  onboarding_completed: boolean;
  onboarding_goal: FOYOnboardingGoal | null;
  onboarding_schedule_days: number | null;
  onboarding_equipment: FOYOnboardingEquipment | null;
  onboarding_style: FOYOnboardingStyle | null;
}>;

export type FOYProfile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

export async function getFOYProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<FOYProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as FOYProfile | null;
}

export async function updateFOYProfileDisplayName(
  supabase: SupabaseClient,
  userId: string,
  display_name: string
): Promise<FOYProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: display_name.trim() || null })
    .eq("id", userId)
    .select("id, display_name, created_at")
    .single();
  if (error) throw error;
  return data as FOYProfile;
}

export async function upsertFOYProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: { display_name?: string | null }
): Promise<FOYProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...payload }, { onConflict: "id" })
    .select("id, display_name, created_at")
    .single();
  if (error) throw error;
  return data as FOYProfile;
}

export async function getFOYUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<FOYUserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as FOYUserSettings | null;
}

export async function upsertFOYUserSettings(
  supabase: SupabaseClient,
  userId: string,
  payload: FOYUserSettingsUpdate
): Promise<FOYUserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ id: userId, ...payload }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as FOYUserSettings;
}
