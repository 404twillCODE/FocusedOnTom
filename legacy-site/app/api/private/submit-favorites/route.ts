import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  verifyPrivateGalleryCookie,
} from "@/lib/photography-tokens";
import { ownerNotificationEmail, sendEmail } from "@/lib/email";
import { PHOTO_BRAND } from "@/lib/photography-config";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PRIVATE_GALLERY_COOKIE_NAME)?.value;
  const claims = token ? await verifyPrivateGalleryCookie(token) : null;
  if (!claims)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: favs, error: selErr } = await admin
      .from("private_favorites")
      .select("photo_path")
      .eq("gallery_id", claims.gid);
    if (selErr) throw selErr;
    await admin
      .from("private_favorites")
      .update({ submitted: true, submitted_at: now })
      .eq("gallery_id", claims.gid);
    await admin
      .from("private_galleries")
      .update({ state: "editing" })
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
        subject: `Private gallery submitted · ${gallery?.title ?? claims.slug}`,
        html: `<p>${gallery?.client_email ?? "A client"} just submitted ${
          (favs ?? []).length
        } selections for <b>${gallery?.title ?? claims.slug}</b>.</p>
          <p><a href="${PHOTO_BRAND.siteUrl}/admin/photography/${encodeURIComponent(
            claims.slug
          )}">Open gallery in admin</a></p>`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/private/submit-favorites] failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
