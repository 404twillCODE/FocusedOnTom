import { NextRequest, NextResponse } from "next/server";
import {
  LICENSE_TIERS,
  PHOTO_BRAND,
  getLicense,
} from "@/lib/photography-config";
import { getStripe, resolvePriceId } from "@/lib/stripe";
import { getUserEmailFromRequest } from "@/lib/supabase/admin";
import type { LicenseId } from "@/lib/photography-types";
import { isPhotographySourceTeVisuals } from "@/lib/tevisuals/client";

type Body = {
  /** Preferred: camelCase from browser clients. */
  photoId?: string;
  /** Legacy snake_case */
  photo_id?: string;
  photo_ids?: string[];
  photoPath?: string;
  photo_path?: string;
  license?: LicenseId;
  returnUrl?: string;
  return_url?: string;
  buyerEmail?: string;
  buyer_email?: string;
};

/** Single-photo id resolution: prefers `photoId`, then `photo_id`, then `photo_ids[0]`. */
function resolveCheckoutPhotoIds(body: Body): string[] {
  if (Array.isArray(body.photo_ids) && body.photo_ids.length > 0) {
    return body.photo_ids.map((id) => id.trim()).filter(Boolean);
  }
  const one =
    body.photoId?.trim() || body.photo_id?.trim() || "";
  return one ? [one] : [];
}

function resolveCheckoutPhotoPath(body: Body): string | undefined {
  const p = body.photoPath?.trim() ?? body.photo_path?.trim();
  return p || undefined;
}

function sanitizeFotReturnUrl(
  request: NextRequest,
  raw?: string
): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.origin !== request.nextUrl.origin) {
      console.warn(
        "[api/photo/checkout] returnUrl rejected: wrong origin",
        u.origin
      );
      return null;
    }
    return u.href;
  } catch {
    return null;
  }
}

/**
 * Create a Stripe Checkout session for a photo purchase or for the Unlimited
 * subscription. When `PHOTOGRAPHY_SOURCE=tevisuals`, checkout is handled only on TE
 * Visuals (FocusedOnTom is gallery-only). Local-source Stripe checkout unchanged.
 *
 * Returns `{ url }` on success. When Stripe isn't configured, returns
 * `{ error: "stripe_not_configured" }` with status 501 so the client can
 * fall back to a mailto link.
 */
export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const license = body.license;
  const tier = license ? getLicense(license) : undefined;
  if (!tier || !LICENSE_TIERS.includes(tier)) {
    return NextResponse.json({ error: "invalid_license" }, { status: 400 });
  }

  if (isPhotographySourceTeVisuals()) {
    return NextResponse.json(
      {
        error: "tevisuals_checkout_on_te_visuals_only",
        message:
          "FocusedOnTom hosts the TE Visuals gallery only. Purchases happen on TE Visuals (use Buy on TE Visuals in the lightbox).",
      },
      { status: 410 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "stripe_not_configured", mailto: PHOTO_BRAND.contactEmail },
      { status: 501 }
    );
  }

  const priceId = resolvePriceId(tier.stripePriceEnvVar);
  if (!priceId) {
    return NextResponse.json(
      { error: "price_id_missing", priceEnv: tier.stripePriceEnvVar },
      { status: 501 }
    );
  }

  const origin = request.nextUrl.origin;

  try {
    if (tier.subscription) {
      const auth = await getUserEmailFromRequest(request);
      if (!auth) {
        return NextResponse.json(
          {
            error: "auth_required",
            message: "Sign in with your email to start the Unlimited plan.",
          },
          { status: 401 }
        );
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: auth.email,
        success_url: `${origin}/photography/thank-you?session_id={CHECKOUT_SESSION_ID}&kind=subscription`,
        cancel_url: `${origin}/photography/unlimited?canceled=1`,
        metadata: {
          kind: "unlimited_subscription",
          supabase_user_id: auth.userId,
        },
        subscription_data: {
          metadata: {
            supabase_user_id: auth.userId,
          },
        },
      });
      return NextResponse.json({ url: session.url });
    }

    // One-time photo purchase
    const photoIds = resolveCheckoutPhotoIds(body);
    const photoId = photoIds[0];
    const photoPath = resolveCheckoutPhotoPath(body);
    if (!photoId || photoIds.length === 0) {
      return NextResponse.json({ error: "photo_id_required" }, { status: 400 });
    }
    const auth = await getUserEmailFromRequest(request);
    const guestEmail = body.buyer_email?.trim() ?? body.buyerEmail?.trim();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: photoIds.length }],
      customer_email: auth?.email ?? guestEmail ?? undefined,
      success_url: `${origin}/photography/thank-you?session_id={CHECKOUT_SESSION_ID}&kind=photo`,
      cancel_url: `${origin}/photography`,
      payment_intent_data: {
        metadata: {
          kind: "photo_purchase",
          photo_id: photoId,
          photo_ids: photoIds.join(","),
          photo_path: photoPath ?? "",
          license: tier.id,
          supabase_user_id: auth?.userId ?? "",
        },
      },
      metadata: {
        kind: "photo_purchase",
        photo_id: photoId,
        photo_ids: photoIds.join(","),
        photo_path: photoPath ?? "",
        license: tier.id,
        supabase_user_id: auth?.userId ?? "",
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[api/photo/checkout] failed", err);
    return NextResponse.json(
      { error: "checkout_failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
