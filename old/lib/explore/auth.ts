import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function isExploreAdmin(userId?: string | null) {
  if (!userId) return false;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("explore_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function requireExploreAdmin() {
  const user = await getSessionUser();
  if (!user || !(await isExploreAdmin(user.id))) {
    return null;
  }
  return user;
}
