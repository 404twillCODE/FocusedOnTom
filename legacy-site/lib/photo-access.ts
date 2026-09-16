import { getSupabaseAdmin, isEmailAdmin } from "@/lib/supabase/admin";

export type CanonicalPhoto = {
  id: string;
  gallery_slug: string;
  category_slug: string | null;
  event_slug: string | null;
  filename: string;
  original_key: string;
  public_key: string;
  public_url: string;
  width: number;
  height: number;
  original_size: number;
  public_size: number;
  price_cents: number;
  is_for_sale: boolean;
  created_at: string;
};

export type PhotoAccessUser = {
  userId: string;
  email: string;
};

export async function getCanonicalPhoto(photoId: string): Promise<CanonicalPhoto | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("photos")
      .select(
        "id, gallery_slug, category_slug, event_slug, filename, original_key, public_key, public_url, width, height, original_size, public_size, price_cents, is_for_sale, created_at"
      )
      .eq("id", photoId)
      .maybeSingle();
    if (error) {
      console.warn("[photo-access] photos lookup failed", error.message);
      return null;
    }
    return (data as CanonicalPhoto | null) ?? null;
  } catch (error) {
    console.warn("[photo-access] photos lookup unavailable", error);
    return null;
  }
}

export async function hasActiveUnlimited(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  try {
    const { data } = await admin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (
      data &&
      ["active", "trialing"].includes(data.status) &&
      (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now())
    ) {
      return true;
    }
  } catch {
    // Compatibility fallback below.
  }

  try {
    const { data } = await admin
      .from("photo_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    return (
      !!data &&
      ["active", "trialing"].includes(data.status) &&
      (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now())
    );
  } catch {
    return false;
  }
}

export async function ownsPhoto(user: PhotoAccessUser, photoId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  try {
    const { data } = await admin
      .from("purchase_items")
      .select("id, purchases!inner(user_id, buyer_email, status)")
      .eq("photo_id", photoId)
      .in("purchases.status", ["paid", "delivered"])
      .or(`user_id.eq.${user.userId},buyer_email.eq.${user.email}`, {
        foreignTable: "purchases",
      })
      .limit(1);
    if ((data?.length ?? 0) > 0) return true;
  } catch {
    // Compatibility fallback below.
  }

  try {
    const { data } = await admin
      .from("photo_orders")
      .select("id")
      .eq("photo_id", photoId)
      .in("status", ["paid", "delivered"])
      .or(`user_id.eq.${user.userId},buyer_email.eq.${user.email}`)
      .limit(1);
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function canAccessOriginal(
  user: PhotoAccessUser,
  photoId: string
): Promise<{ allowed: boolean; reason: "admin" | "purchase" | "subscription" | "denied" }> {
  if (await isEmailAdmin(user.email)) return { allowed: true, reason: "admin" };
  if (await ownsPhoto(user, photoId)) return { allowed: true, reason: "purchase" };
  if (await hasActiveUnlimited(user.userId)) {
    return { allowed: true, reason: "subscription" };
  }
  return { allowed: false, reason: "denied" };
}
