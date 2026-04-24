import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest } from "@/lib/supabase/admin";

/**
 * Returns whether the authed user has an active Unlimited subscription,
 * and (if photo_id is passed) whether they've purchased that photo.
 *
 * Never throws — returns `{ unlimited: false, owns: false }` as a safe
 * default. Drives watermark hiding in the lightbox.
 */
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ unlimited: false, owns: false });
  }
  const photoId = request.nextUrl.searchParams.get("photo_id");
  try {
    const admin = getSupabaseAdmin();

    const [subRes, orderRes] = await Promise.all([
      admin
        .from("photo_subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
      photoId
        ? admin
            .from("photo_orders")
            .select("id, status")
            .eq("user_id", userId)
            .eq("photo_id", photoId)
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

    return NextResponse.json({ unlimited, owns });
  } catch (err) {
    console.error("[api/photo/entitlements] failed", err);
    return NextResponse.json({ unlimited: false, owns: false });
  }
}
