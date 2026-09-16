import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = request.nextUrl.searchParams.get("email");
  if (!token || !email) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("email, verify_token")
      .eq("email", email)
      .maybeSingle();
    if (error || !data || data.verify_token !== token) {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 400 }
      );
    }
    await admin
      .from("newsletter_subscribers")
      .update({ verified: true, verify_token: null })
      .eq("email", email);
    return NextResponse.redirect(new URL("/photography?newsletter=confirmed", request.url));
  } catch (err) {
    console.error("[api/newsletter/verify] failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
