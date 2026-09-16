import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/** Server-only. Bypasses RLS. Never import from client components. */
export function createServiceSupabaseClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
