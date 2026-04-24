import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  verifyPrivateGalleryCookie,
} from "@/lib/photography-tokens";
import { PRIVATE_GALLERY_FAVORITES_LIMIT } from "@/lib/photography-config";

async function requireGallery(
  request: NextRequest
): Promise<{ gid: string; slug: string } | null> {
  const token = request.cookies.get(PRIVATE_GALLERY_COOKIE_NAME)?.value;
  if (!token) return null;
  const claims = await verifyPrivateGalleryCookie(token);
  return claims ? { gid: claims.gid, slug: claims.slug } : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireGallery(request);
  if (!auth)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { photo_path?: string; note?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body ok */
  }
  const photoPath = body.photo_path?.trim();
  if (!photoPath) {
    return NextResponse.json(
      { ok: false, error: "photo_path required" },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const { count } = await admin
      .from("private_favorites")
      .select("*", { count: "exact", head: true })
      .eq("gallery_id", auth.gid);
    if ((count ?? 0) >= PRIVATE_GALLERY_FAVORITES_LIMIT) {
      return NextResponse.json(
        {
          ok: false,
          error: `You've selected ${PRIVATE_GALLERY_FAVORITES_LIMIT} — that's the max.`,
        },
        { status: 400 }
      );
    }
    const { error } = await admin.from("private_favorites").upsert(
      {
        gallery_id: auth.gid,
        photo_path: photoPath,
        note: body.note ?? null,
      },
      { onConflict: "gallery_id,photo_path" }
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/private/favorite] POST failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireGallery(request);
  if (!auth)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { photo_path?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  const photoPath = body.photo_path?.trim();
  if (!photoPath) {
    return NextResponse.json(
      { ok: false, error: "photo_path required" },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("private_favorites")
      .delete()
      .eq("gallery_id", auth.gid)
      .eq("photo_path", photoPath);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/private/favorite] DELETE failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
