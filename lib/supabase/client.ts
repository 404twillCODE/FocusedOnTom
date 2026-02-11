import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (createClient("https://placeholder.invalid", "placeholder-key") as SupabaseClient);

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  date: string;
  workout_type: string;
  workout_name: string | null;
  reps: number | null;
  sets: number | null;
  lbs: number | null;
  duration_min: number;
  notes: string;
  created_at: string;
};

export type WorkoutLogWithProfile = WorkoutLog & {
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};
