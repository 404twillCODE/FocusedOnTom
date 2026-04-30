import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAdmin } from "@/lib/supabase/admin";

export type SiteUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export async function getSiteUser(): Promise<SiteUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;
  const email = user.email.toLowerCase();

  return {
    id: user.id,
    email,
    isAdmin: await isEmailAdmin(email),
  };
}

export async function requireSiteApiUser(): Promise<
  { user: SiteUser; response: null } | { user: null; response: NextResponse }
> {
  const user = await getSiteUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}
