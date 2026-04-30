import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserEmailFromRequest } from "@/lib/supabase/admin";
import { getPhotoById } from "@/lib/photography";
import { hasActiveUnlimited } from "@/lib/photo-access";
import { isEmailAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PurchasePhoto = {
  id: string;
  filename: string;
  public_url: string;
  width: number;
  height: number;
  gallery_slug?: string;
  price_cents?: number;
  access: "purchase" | "subscription";
};

function manifestPhoto(photoId: string, access: "purchase" | "subscription"): PurchasePhoto | null {
  const photo = getPhotoById(photoId);
  if (!photo) return null;
  return {
    id: photoId,
    filename: photo.alt,
    public_url: photo.src,
    width: photo.width,
    height: photo.height,
    gallery_slug: photo.eventSlug,
    access,
  };
}

export async function GET(request: NextRequest) {
  const auth = await getUserEmailFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const isAdmin = await isEmailAdmin(auth.email);
  const unlimited = isAdmin || (await hasActiveUnlimited(auth.userId));

  try {
    if (unlimited) {
      const { data, error } = await admin
        .from("photos")
        .select("id, filename, public_url, width, height, gallery_slug, price_cents")
        .eq("is_for_sale", true)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return NextResponse.json({
        unlimited: true,
        admin: isAdmin,
        photos: ((data ?? []) as Omit<PurchasePhoto, "access">[]).map((photo) => ({
          ...photo,
          access: "subscription" as const,
        })),
      });
    }

    const { data: purchases } = await admin
      .from("purchases")
      .select("id")
      .in("status", ["paid", "delivered"])
      .or(`user_id.eq.${auth.userId},buyer_email.eq.${auth.email}`);
    const purchaseIds = (purchases ?? []).map((purchase) => purchase.id);

    const canonicalPhotoIds =
      purchaseIds.length > 0
        ? (
            (
              await admin
                .from("purchase_items")
                .select("photo_id")
                .in("purchase_id", purchaseIds)
            ).data ?? []
          ).map((item) => item.photo_id)
        : [];

    const { data: legacyOrders } = await admin
      .from("photo_orders")
      .select("photo_id")
      .in("status", ["paid", "delivered"])
      .or(`user_id.eq.${auth.userId},buyer_email.eq.${auth.email}`);

    const photoIds = [
      ...new Set([
        ...canonicalPhotoIds,
        ...((legacyOrders ?? []).map((order) => order.photo_id).filter(Boolean) as string[]),
      ]),
    ];

    let photos: PurchasePhoto[] = [];
    if (photoIds.length > 0) {
      const { data } = await admin
        .from("photos")
        .select("id, filename, public_url, width, height, gallery_slug, price_cents")
        .in("id", photoIds);
      photos = ((data ?? []) as Omit<PurchasePhoto, "access">[]).map((photo) => ({
        ...photo,
        access: "purchase",
      }));
    }

    const found = new Set(photos.map((photo) => photo.id));
    for (const photoId of photoIds) {
      if (!found.has(photoId)) {
        const fallback = manifestPhoto(photoId, "purchase");
        if (fallback) photos.push(fallback);
      }
    }

    return NextResponse.json({ unlimited: false, admin: false, photos });
  } catch (error) {
    console.error("[api/photo/purchases] failed", error);
    return NextResponse.json({ error: "failed_to_load_purchases" }, { status: 500 });
  }
}
