import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireVaultApiUser } from "@/lib/vault/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  if (!auth.user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const gallery = params.get("gallery")?.trim();

  try {
    let query = getSupabaseAdmin()
      .from("photos")
      .select(
        "id, gallery_slug, category_slug, event_slug, filename, public_url, public_key, width, height, original_size, public_size, price_cents, is_for_sale, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (q) query = query.or(`filename.ilike.%${q}%,gallery_slug.ilike.%${q}%`);
    if (gallery) query = query.eq("gallery_slug", gallery);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ photos: data ?? [] });
  } catch (error) {
    console.error("[api/vault/photos] failed", error);
    return NextResponse.json({ error: "failed_to_load_photos" }, { status: 500 });
  }
}
