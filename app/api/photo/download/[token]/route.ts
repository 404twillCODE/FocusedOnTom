import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyDownloadToken } from "@/lib/photography-tokens";
import { presignR2Get, r2ObjectExists } from "@/lib/r2";
import { DOWNLOAD_TOKEN_MAX_USES } from "@/lib/photography-config";

export const runtime = "nodejs";

/**
 * Validates the signed download token, increments usage, and redirects to a
 * short-lived presigned R2 URL for the photo original (or the 3000px WebP
 * if no original was uploaded).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const claims = await verifyDownloadToken(token);
  if (!claims) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 410 });
  }

  const admin = getSupabaseAdmin();
  const { data: order, error } = await admin
    .from("photo_orders")
    .select("id, photo_id, photo_path, download_count, expires_at, status, license")
    .eq("id", claims.orderId)
    .maybeSingle();
  if (error || !order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (order.photo_id !== claims.photoId) {
    return NextResponse.json({ error: "token_mismatch" }, { status: 403 });
  }
  if (order.status === "refunded" || order.status === "failed") {
    return NextResponse.json({ error: "order_not_active" }, { status: 403 });
  }
  if (
    order.expires_at &&
    new Date(order.expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if ((order.download_count ?? 0) >= DOWNLOAD_TOKEN_MAX_USES) {
    return NextResponse.json({ error: "download_limit_reached" }, { status: 410 });
  }

  const photoPath = order.photo_path;
  if (!photoPath) {
    return NextResponse.json({ error: "missing_path" }, { status: 500 });
  }

  // Prefer the original when available; fall back to the compressed WebP.
  const originalKey = `photography-originals/${photoPath.replace(/\.webp$/i, ".jpg")}`;
  const webpKey = `photography/${photoPath}`;

  let signed: string | null = null;
  if (await r2ObjectExists(originalKey)) {
    signed = await presignR2Get(originalKey, 60 * 15);
  }
  if (!signed) {
    signed = await presignR2Get(webpKey, 60 * 15);
  }
  if (!signed) {
    return NextResponse.json(
      { error: "file_unavailable" },
      { status: 500 }
    );
  }

  await admin
    .from("photo_orders")
    .update({ download_count: (order.download_count ?? 0) + 1 })
    .eq("id", order.id);

  return NextResponse.redirect(signed, { status: 302 });
}
