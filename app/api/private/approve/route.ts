import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  verifyPrivateGalleryCookie,
} from "@/lib/photography-tokens";
import { ownerNotificationEmail, sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PRIVATE_GALLERY_COOKIE_NAME)?.value;
  const claims = token ? await verifyPrivateGalleryCookie(token) : null;
  if (!claims)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const admin = getSupabaseAdmin();
    await admin
      .from("private_galleries")
      .update({ state: "approved" })
      .eq("id", claims.gid);
    const { data: gallery } = await admin
      .from("private_galleries")
      .select("title, client_email")
      .eq("id", claims.gid)
      .maybeSingle();
    const owner = ownerNotificationEmail();
    if (owner) {
      await sendEmail({
        to: owner,
        subject: `Private gallery approved · ${gallery?.title ?? claims.slug}`,
        html: `<p>${gallery?.client_email ?? "A client"} approved <b>${gallery?.title ?? claims.slug}</b>.</p>`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/private/approve] failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
