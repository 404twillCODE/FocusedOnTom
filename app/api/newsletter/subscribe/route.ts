import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { PHOTO_BRAND } from "@/lib/photography-config";

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: NextRequest) {
  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email." },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const verifying = isEmailConfigured();
    const token = verifying ? crypto.randomUUID().replace(/-/g, "") : null;
    await admin.from("newsletter_subscribers").upsert(
      {
        email,
        verified: !verifying, // if email isn't set up, just opt them in
        verify_token: token,
      },
      { onConflict: "email" }
    );
    if (verifying && token) {
      const verifyUrl = `${PHOTO_BRAND.siteUrl}/api/newsletter/verify?token=${token}&email=${encodeURIComponent(email)}`;
      await sendEmail({
        to: email,
        subject: `Confirm your subscription to ${PHOTO_BRAND.watermarkText}`,
        html: `<p>Thanks for subscribing. Click below to confirm:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    }
    return NextResponse.json({ ok: true, verifying });
  } catch (err) {
    console.error("[api/newsletter/subscribe] failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
