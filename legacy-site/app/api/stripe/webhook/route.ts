import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, ownerNotificationEmail } from "@/lib/email";
import { signDownloadToken } from "@/lib/photography-tokens";
import {
  DOWNLOAD_TOKEN_MAX_AGE_SEC,
  PHOTO_BRAND,
  getLicense,
} from "@/lib/photography-config";
import type { LicenseId } from "@/lib/photography-types";
import { getPrintProvider } from "@/lib/print-provider";

/**
 * Stripe expects the raw request body for signature verification, so this
 * route uses `request.text()`. Must not be edge runtime (needs nodejs crypto).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 501 });
  }
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json(
      { error: "invalid_signature", message: (err as Error).message },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler failed", err);
    return NextResponse.json(
      { error: "handler_failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const kind = md.kind;
  const admin = getSupabaseAdmin();

  if (kind === "photo_purchase") {
    const photoId = md.photo_id ?? "";
    const photoIds = (md.photo_ids ?? photoId)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const photoPath = md.photo_path ?? "";
    const license = (md.license ?? "personal") as LicenseId;
    const tier = getLicense(license);
    const amount =
      session.amount_total ?? session.amount_subtotal ?? tier?.priceCents ?? 0;
    const buyerEmail =
      session.customer_details?.email ??
      (typeof session.customer_email === "string" ? session.customer_email : "") ??
      "";
    const userId = md.supabase_user_id || null;

    const expiresAt = new Date(
      Date.now() + DOWNLOAD_TOKEN_MAX_AGE_SEC * 1000
    ).toISOString();

    const { data: insertedOrder, error: insertErr } = await admin
      .from("photo_orders")
      .insert({
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        buyer_email: buyerEmail,
        user_id: userId || null,
        photo_id: photoId,
        photo_path: photoPath,
        license,
        amount_cents: amount,
        status: "paid",
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertErr || !insertedOrder) {
      console.error("[stripe/webhook] insert photo_orders failed", insertErr);
      return;
    }

    const token = await signDownloadToken(
      { orderId: insertedOrder.id, photoId },
      DOWNLOAD_TOKEN_MAX_AGE_SEC
    );

    await admin
      .from("photo_orders")
      .update({ download_token: token, status: "delivered" })
      .eq("id", insertedOrder.id);

    try {
      const { data: purchase, error: purchaseErr } = await admin
        .from("purchases")
        .insert({
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          buyer_email: buyerEmail,
          user_id: userId || null,
          amount_cents: amount,
          license,
          status: "delivered",
          download_token: token,
          expires_at: expiresAt,
          metadata: { legacy_order_id: insertedOrder.id, photo_path: photoPath },
        })
        .select("id")
        .single();

      if (purchaseErr || !purchase) {
        console.error("[stripe/webhook] insert purchases failed", purchaseErr);
      } else {
        const itemAmount = Math.round(amount / Math.max(photoIds.length, 1));
        const { error: itemErr } = await admin.from("purchase_items").insert(
          photoIds.map((id) => ({
            purchase_id: purchase.id,
            photo_id: id,
            unit_amount_cents: itemAmount,
            license,
          }))
        );
        if (itemErr) {
          console.error("[stripe/webhook] insert purchase_items failed", itemErr);
        }
      }
    } catch (err) {
      console.error("[stripe/webhook] canonical purchase write failed", err);
    }

    if (buyerEmail) {
      const downloadUrl = `${PHOTO_BRAND.siteUrl}/api/photo/download/${token}`;
      await sendEmail({
        to: buyerEmail,
        subject: `Your photo download from ${PHOTO_BRAND.watermarkText}`,
        html: `<p>Thanks for your purchase.</p>
          <p>Download your photo (${license}):</p>
          <p><a href="${downloadUrl}">${downloadUrl}</a></p>
          <p>Link expires in 7 days and allows up to 5 downloads.</p>`,
      });
    }

    const ownerEmail = ownerNotificationEmail();
    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: `New photo sale · ${license} · $${(amount / 100).toFixed(2)}`,
        html: `<p>Photo ${photoId} sold to ${buyerEmail || "(no email)"}.</p>`,
      });
    }
  }

  if (kind === "print_purchase") {
    await handlePrintCheckoutCompleted(session);
    return;
  }

  if (kind === "booking_deposit") {
    await handleBookingCheckoutCompleted(session);
    return;
  }

  if (kind === "unlimited_subscription") {
    // Subscription creation follow-up is handled by
    // customer.subscription.* events. Just ensure we have the row.
    const userId = md.supabase_user_id;
    const customerEmail =
      session.customer_details?.email ??
      (typeof session.customer_email === "string" ? session.customer_email : "");
    if (userId && customerEmail) {
      await admin.from("photo_subscriptions").upsert(
        {
          user_id: userId,
          email: customerEmail,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === "string" ? session.subscription : null,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      try {
        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            email: customerEmail,
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (err) {
        console.error("[stripe/webhook] canonical subscription write failed", err);
      }
    }
  }
}

async function handlePrintCheckoutCompleted(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const admin = getSupabaseAdmin();
  const photoId = md.photo_id ?? "";
  const photoPath = md.photo_path ?? "";
  const photoUrl = md.photo_url ?? "";
  const sizeId = md.size_id ?? "";
  const paperId = md.paper_id ?? "";
  const buyerName = md.buyer_name ?? "";
  const userId = md.supabase_user_id || null;
  const notes = md.notes ?? "";

  const buyerEmail =
    session.customer_details?.email ??
    (typeof session.customer_email === "string" ? session.customer_email : "") ??
    "";
  const shipping = session.collected_information?.shipping_details;
  const amount = session.amount_total ?? session.amount_subtotal ?? 0;

  const provider = getPrintProvider();

  const { data: order, error } = await admin
    .from("print_orders")
    .insert({
      stripe_session_id: session.id,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      user_id: userId,
      photo_id: photoId,
      photo_path: photoPath,
      size_id: sizeId,
      paper_id: paperId,
      amount_cents: amount,
      shipping: shipping ?? null,
      provider: provider.name,
      status: "paid",
    })
    .select("id")
    .single();
  if (error || !order) {
    console.error("[stripe/webhook] insert print_orders failed", error);
    return;
  }

  let providerStatus: "submitted" | "queued" | "noop" = "noop";
  let providerOrderId: string | null = null;
  try {
    if (shipping?.address?.line1) {
      const result = await provider.createOrder({
        photoId,
        photoUrl,
        sizeId,
        paperId,
        buyerEmail,
        buyerName,
        shipping: {
          line1: shipping.address.line1 ?? "",
          line2: shipping.address.line2 ?? undefined,
          city: shipping.address.city ?? "",
          state: shipping.address.state ?? undefined,
          postal_code: shipping.address.postal_code ?? "",
          country: shipping.address.country ?? "",
        },
        amountCents: amount,
        stripeSessionId: session.id,
      });
      providerStatus = result.status;
      providerOrderId = result.providerOrderId;
    }
  } catch (e) {
    console.error("[stripe/webhook] print provider failed", e);
  }

  await admin
    .from("print_orders")
    .update({
      provider_order_id: providerOrderId,
      status: providerStatus === "submitted" ? "submitted" : "paid",
    })
    .eq("id", order.id);

  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: `Print order received · ${PHOTO_BRAND.watermarkText}`,
      html: `<p>Thanks for your print order.</p>
        <p>We'll send a proof and tracking info to this address.</p>
        ${notes ? `<p>Your notes: ${notes}</p>` : ""}`,
    });
  }
  const ownerEmail = ownerNotificationEmail();
  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `New print order · ${sizeId} ${paperId}`,
      html: `<p>Photo ${photoId} · $${(amount / 100).toFixed(2)} · ${buyerEmail || "no email"}</p>
        <pre>${JSON.stringify(shipping ?? {}, null, 2)}</pre>
        ${notes ? `<p>Notes: ${notes}</p>` : ""}`,
    });
  }
}

async function handleBookingCheckoutCompleted(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const admin = getSupabaseAdmin();
  const bookingId = md.booking_id;
  if (!bookingId) return;

  await admin
    .from("photo_bookings")
    .update({
      status: "deposit_paid",
      stripe_session_id: session.id,
    })
    .eq("id", bookingId);

  const ownerEmail = ownerNotificationEmail();
  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `Booking deposit paid · ${md.session_type ?? "session"}`,
      html: `<p>Booking ${bookingId} deposit received.</p>`,
    });
  }
  const buyerEmail =
    session.customer_details?.email ??
    (typeof session.customer_email === "string" ? session.customer_email : "") ??
    "";
  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: `Session deposit received · ${PHOTO_BRAND.watermarkText}`,
      html: `<p>Thanks for securing your session. We'll confirm the final details by email shortly.</p>`,
    });
  }
}

type SubscriptionWithPeriodEnd = Stripe.Subscription & {
  current_period_end?: number;
};

async function upsertSubscription(sub: Stripe.Subscription) {
  const admin = getSupabaseAdmin();
  const userId = (sub.metadata ?? {}).supabase_user_id;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!userId) {
    console.warn(
      "[stripe/webhook] subscription without supabase_user_id metadata",
      sub.id
    );
    return;
  }
  const subWithPeriod = sub as SubscriptionWithPeriodEnd;
  const current_period_end = subWithPeriod.current_period_end
    ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
    : null;

  // Email may not be on the subscription; try to fetch the customer.
  let email = "";
  const stripe = getStripe();
  if (stripe && customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !("deleted" in customer && customer.deleted)) {
        email = customer.email ?? "";
      }
    } catch {
      // ignore
    }
  }

  await admin.from("photo_subscriptions").upsert(
    {
      user_id: userId,
      email,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  try {
    await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        email,
        stripe_customer_id: customerId ?? null,
        stripe_subscription_id: sub.id,
        status: sub.status,
        current_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.error("[stripe/webhook] canonical subscription upsert failed", err);
  }
}
