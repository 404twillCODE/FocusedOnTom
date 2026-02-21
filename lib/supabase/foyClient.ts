"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Supabase client for FocusedOnYou app. Uses cookie-based session
 * so middleware can enforce auth on /focusedonyou routes.
 */
export function createFOYSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton for client components (avoids creating multiple instances)
let foyClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getFOYSupabase() {
  if (!foyClientInstance) {
    foyClientInstance = createFOYSupabaseClient();
  }
  return foyClientInstance;
}
