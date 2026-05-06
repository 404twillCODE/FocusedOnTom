import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getUserEmailFromRequest,
  getUserIdFromRequest,
  isEmailAdmin,
} from "@/lib/supabase/admin";
import { hasActiveUnlimited, ownsPhoto } from "@/lib/photo-access";
import { isPhotographySourceTeVisuals } from "@/lib/tevisuals/client";

/**
 * Returns whether the user has Unlimited and/or owns a photo (legacy FocusedOnTom
 * storefront only). TE-backed catalogs do not expose purchase state on FOT —
 * buying and entitlement checks happen on TE Visuals.
 */
export async function GET(request: NextRequest) {
  const photoIdRaw = request.nextUrl.searchParams.get("photo_id");

  try {
    if (isPhotographySourceTeVisuals()) {
      return NextResponse.json({
        unlimited: false,
        owns: false,
        source: "tevisuals",
      });
    }

    // ---------------------------------------------------------------------
    // Legacy FOT commerce — requires Supabase user
    // ---------------------------------------------------------------------
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ unlimited: false, owns: false });
    }

    const auth = await getUserEmailFromRequest(request);
    if (!auth?.email?.trim()) {
      console.error(
        "[api/photo/entitlements] legacy: signed-in user missing email on JWT"
      );
      return NextResponse.json({ unlimited: false, owns: false });
    }

    if (await isEmailAdmin(auth.email)) {
      return NextResponse.json({ unlimited: true, owns: true, admin: true });
    }

    const admin = getSupabaseAdmin();

    const [subRes, orderRes] = await Promise.all([
      admin
        .from("photo_subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
      photoIdRaw
        ? admin
            .from("photo_orders")
            .select("id, status")
            .eq("user_id", userId)
            .eq("photo_id", photoIdRaw)
            .in("status", ["paid", "delivered"])
            .limit(1)
        : Promise.resolve({ data: null, error: null } as { data: null; error: null }),
    ]);

    const sub = subRes.data;
    const unlimited =
      !!sub &&
      (sub.status === "active" || sub.status === "trialing") &&
      (!sub.current_period_end ||
        new Date(sub.current_period_end).getTime() > Date.now());

    const owns = Array.isArray((orderRes as { data?: unknown[] }).data)
      ? ((orderRes as { data: unknown[] }).data?.length ?? 0) > 0
      : false;

    const canonicalUnlimited = await hasActiveUnlimited(userId);
    const canonicalOwns =
      photoIdRaw && auth ? await ownsPhoto(auth, photoIdRaw) : false;

    return NextResponse.json({
      unlimited: unlimited || canonicalUnlimited,
      owns: owns || canonicalOwns,
      source: "focusedontom",
    });
  } catch (err) {
    console.error("[api/photo/entitlements] failed", err);
    return NextResponse.json({ unlimited: false, owns: false });
  }
}
