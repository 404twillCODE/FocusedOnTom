import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest } from "@/lib/supabase/admin";

type Body = { photo_id?: string; photo_path?: string };

async function parseBody(req: NextRequest): Promise<Body> {
  try {
    return (await req.json()) as Body;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "auth_required" },
      { status: 401 }
    );
  }
  const body = await parseBody(request);
  const photoId = typeof body.photo_id === "string" ? body.photo_id.trim() : "";
  if (!photoId) {
    return NextResponse.json(
      { ok: false, error: "photo_id required" },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("photo_favorites")
      .upsert(
        {
          user_id: userId,
          photo_id: photoId,
          photo_path: body.photo_path ?? null,
        },
        { onConflict: "user_id,photo_id" }
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/photo/favorite] POST failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "auth_required" },
      { status: 401 }
    );
  }
  const body = await parseBody(request);
  const photoId = typeof body.photo_id === "string" ? body.photo_id.trim() : "";
  if (!photoId) {
    return NextResponse.json(
      { ok: false, error: "photo_id required" },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("photo_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("photo_id", photoId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/photo/favorite] DELETE failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: true, favorites: [] });
  }
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("photo_favorites")
      .select("photo_id, photo_path, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, favorites: data ?? [] });
  } catch (err) {
    console.error("[api/photo/favorite] GET failed", err);
    return NextResponse.json({ ok: true, favorites: [] });
  }
}
