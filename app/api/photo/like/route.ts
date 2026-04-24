import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest } from "@/lib/supabase/admin";

type Body = {
  photo_id?: string;
  anon_id?: string;
};

async function parseBody(req: NextRequest): Promise<Body> {
  try {
    return (await req.json()) as Body;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  const photoId = typeof body.photo_id === "string" ? body.photo_id.trim() : "";
  if (!photoId) {
    return NextResponse.json(
      { ok: false, error: "photo_id required" },
      { status: 400 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  const anonId =
    typeof body.anon_id === "string" && body.anon_id.length > 0
      ? body.anon_id
      : null;

  if (!userId && !anonId) {
    return NextResponse.json(
      { ok: false, error: "anon_id required when not authenticated" },
      { status: 400 }
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const row = userId
      ? { photo_id: photoId, user_id: userId, anon_id: null }
      : { photo_id: photoId, user_id: null, anon_id: anonId };
    const { error } = await admin
      .from("photo_likes")
      .upsert(row, { onConflict: userId ? "photo_id,user_id" : "photo_id,anon_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/photo/like] POST failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const body = await parseBody(request);
  const photoId = typeof body.photo_id === "string" ? body.photo_id.trim() : "";
  if (!photoId) {
    return NextResponse.json(
      { ok: false, error: "photo_id required" },
      { status: 400 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  const anonId =
    typeof body.anon_id === "string" && body.anon_id.length > 0
      ? body.anon_id
      : null;

  try {
    const admin = getSupabaseAdmin();
    let q = admin.from("photo_likes").delete().eq("photo_id", photoId);
    if (userId) q = q.eq("user_id", userId);
    else if (anonId) q = q.eq("anon_id", anonId);
    else
      return NextResponse.json(
        { ok: false, error: "auth or anon_id required" },
        { status: 400 }
      );
    const { error } = await q;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/photo/like] DELETE failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const photoId = request.nextUrl.searchParams.get("photo_id");
  if (!photoId) {
    return NextResponse.json(
      { ok: false, error: "photo_id required" },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const { count, error } = await admin
      .from("photo_likes")
      .select("*", { count: "exact", head: true })
      .eq("photo_id", photoId);
    if (error) throw error;
    return NextResponse.json({ ok: true, count: count ?? 0 });
  } catch (err) {
    console.error("[api/photo/like] GET failed", err);
    return NextResponse.json({ ok: true, count: 0 });
  }
}
