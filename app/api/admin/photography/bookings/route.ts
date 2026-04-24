import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function checkAdmin(req: NextRequest): boolean {
  const password = process.env.ADMIN_GATE_PASSWORD ?? process.env.WORKOUT_GATE_PASSWORD;
  if (!password) return false;
  const provided = req.headers.get("x-admin-password") ?? "";
  return provided === password;
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("photo_bookings")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, bookings: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { id?: string; status?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const allowed = [
    "requested",
    "deposit_paid",
    "confirmed",
    "canceled",
    "completed",
  ];
  if (!body.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("photo_bookings")
      .update({ status: body.status })
      .eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
