import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PrivateGalleryState } from "@/lib/photography-types";

const VALID_STATES: PrivateGalleryState[] = [
  "proofing",
  "editing",
  "final_delivery",
  "approved",
];

function checkAdmin(req: NextRequest): boolean {
  const password = process.env.ADMIN_GATE_PASSWORD ?? process.env.WORKOUT_GATE_PASSWORD;
  if (!password) return false;
  const provided = req.headers.get("x-admin-password") ?? "";
  return provided === password;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  try {
    const admin = getSupabaseAdmin();
    const { data: gallery, error } = await admin
      .from("private_galleries")
      .select(
        "id, slug, title, client_name, client_email, state, allow_all_zip, final_message, created_at, expires_at"
      )
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!gallery)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    const [{ data: favs }, { data: finals }] = await Promise.all([
      admin
        .from("private_favorites")
        .select("photo_path, note, submitted, created_at")
        .eq("gallery_id", gallery.id),
      admin
        .from("private_gallery_photos")
        .select("id, photo_path, is_final, final_url, created_at")
        .eq("gallery_id", gallery.id),
    ]);
    return NextResponse.json({
      ok: true,
      gallery,
      favorites: favs ?? [],
      finalPhotos: finals ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

type PatchBody = {
  state?: PrivateGalleryState;
  allow_all_zip?: boolean;
  final_message?: string;
  add_final?: { photo_path: string; final_url: string };
  remove_final?: string;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  try {
    const admin = getSupabaseAdmin();
    const { data: gallery, error: glErr } = await admin
      .from("private_galleries")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (glErr) throw glErr;
    if (!gallery)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );

    const update: Record<string, unknown> = {};
    if (body.state) {
      if (!VALID_STATES.includes(body.state)) {
        return NextResponse.json(
          { ok: false, error: "invalid_state" },
          { status: 400 }
        );
      }
      update.state = body.state;
    }
    if (typeof body.allow_all_zip === "boolean")
      update.allow_all_zip = body.allow_all_zip;
    if (typeof body.final_message === "string")
      update.final_message = body.final_message;

    if (Object.keys(update).length > 0) {
      const { error: updErr } = await admin
        .from("private_galleries")
        .update(update)
        .eq("id", gallery.id);
      if (updErr) throw updErr;
    }

    if (body.add_final) {
      await admin.from("private_gallery_photos").upsert(
        {
          gallery_id: gallery.id,
          photo_path: body.add_final.photo_path,
          final_url: body.add_final.final_url,
          is_final: true,
        },
        { onConflict: "gallery_id,photo_path" }
      );
    }
    if (body.remove_final) {
      await admin
        .from("private_gallery_photos")
        .delete()
        .eq("gallery_id", gallery.id)
        .eq("photo_path", body.remove_final);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
