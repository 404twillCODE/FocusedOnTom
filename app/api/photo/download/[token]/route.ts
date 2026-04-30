import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyDownloadToken } from "@/lib/photography-tokens";
import { presignR2Get, presignR2GetFromBucket, r2ObjectExists } from "@/lib/r2";
import { DOWNLOAD_TOKEN_MAX_USES } from "@/lib/photography-config";
import { getCanonicalPhoto } from "@/lib/photo-access";

export const runtime = "nodejs";

/**
 * Validates the signed download token, increments usage, and redirects to a
 * short-lived presigned R2 URL for the canonical private original.
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
  let order: {
    id: string;
    photo_id?: string;
    photo_path?: string;
    download_count: number | null;
    expires_at: string | null;
    status: string;
    license?: string;
    canonical?: boolean;
  } | null = null;

  try {
    const { data: canonicalPurchase } = await admin
      .from("purchases")
      .select("id, download_count, expires_at, status, license")
      .eq("id", claims.orderId)
      .maybeSingle();
    if (canonicalPurchase) {
      const { data: item } = await admin
        .from("purchase_items")
        .select("photo_id")
        .eq("purchase_id", canonicalPurchase.id)
        .eq("photo_id", claims.photoId)
        .maybeSingle();
      if (item) {
        order = { ...canonicalPurchase, photo_id: item.photo_id, canonical: true };
      }
    }
  } catch {
    // Fall back to legacy photo_orders below.
  }

  if (!order) {
    const { data: legacyOrder, error } = await admin
      .from("photo_orders")
      .select("id, photo_id, photo_path, download_count, expires_at, status, license")
      .eq("id", claims.orderId)
      .maybeSingle();
    if (error || !legacyOrder) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }
    order = legacyOrder;
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

  const photo = order.photo_id ? await getCanonicalPhoto(order.photo_id) : null;
  let signed: string | null = photo
    ? await presignR2GetFromBucket(photo.original_key, "private", 60 * 3, photo.filename)
    : null;

  if (!signed && order.photo_path) {
    const originalKey = `photography-originals/${order.photo_path.replace(/\.webp$/i, ".jpg")}`;
    const webpKey = `photography/${order.photo_path}`;
    if (await r2ObjectExists(originalKey)) {
      signed = await presignR2Get(originalKey, 60 * 5);
    }
    if (!signed) {
      signed = await presignR2Get(webpKey, 60 * 5);
    }
  }
  if (!signed) {
    return NextResponse.json(
      { error: "file_unavailable" },
      { status: 500 }
    );
  }

  await admin
    .from(order.canonical ? "purchases" : "photo_orders")
    .update({ download_count: (order.download_count ?? 0) + 1 })
    .eq("id", order.id);

  return NextResponse.redirect(signed, { status: 302 });
}
