import { NextRequest, NextResponse } from "next/server";
import {
  LICENSE_TIERS,
  PHOTO_BRAND,
  getLicense,
} from "@/lib/photography-config";
import { getStripe, resolvePriceId } from "@/lib/stripe";
import { getUserEmailFromRequest } from "@/lib/supabase/admin";
import type { LicenseId } from "@/lib/photography-types";

type Body = {
  photo_id?: string;
  photo_ids?: string[];
  photo_path?: string;
  license?: LicenseId;
};

/**
 * Create a Stripe Checkout session for a photo purchase or for the Unlimited
 * subscription. Unlimited requires a logged-in Supabase user; single-photo
 * buys work as guest checkout.
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
    const photoIds = Array.isArray(body.photo_ids)
      ? body.photo_ids.map((id) => id.trim()).filter(Boolean)
      : body.photo_id?.trim()
        ? [body.photo_id.trim()]
        : [];
    const photoId = photoIds[0];
    const photoPath = body.photo_path?.trim();
    if (!photoId || photoIds.length === 0) {
      return NextResponse.json({ error: "photo_id_required" }, { status: 400 });
    }
    const auth = await getUserEmailFromRequest(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: photoIds.length }],
      customer_email: auth?.email,
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
