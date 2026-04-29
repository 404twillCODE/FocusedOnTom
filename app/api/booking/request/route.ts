import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin, getUserEmailFromRequest } from "@/lib/supabase/admin";
import { sendEmail, ownerNotificationEmail } from "@/lib/email";
import {
  composeBookingNotes,
  estimateAutomotiveSessionCents,
  getSessionType,
  labelsForDeliverableIds,
  normalizeCarDeliverableIds,
  PHOTO_BRAND,
} from "@/lib/photography-config";

type Body = {
  session_type?: string;
  name?: string;
  email?: string;
  starts_at?: string;
  notes?: string;
  /** Car session only: which outputs the client wants (statics, rollers, short-form). */
  deliverables?: string[];
};

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionTypeId = body.session_type?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const startsAtRaw = body.starts_at?.trim();
  const clientNotes = body.notes?.trim() ?? "";
  const deliverablesRaw = Array.isArray(body.deliverables)
    ? body.deliverables
    : [];

  const sessionType = sessionTypeId ? getSessionType(sessionTypeId) : undefined;
  if (!sessionType) {
    return NextResponse.json({ error: "invalid_session_type" }, { status: 400 });
  }

  const normalizedDeliverables =
    sessionType.id === "automotive"
      ? normalizeCarDeliverableIds(deliverablesRaw)
      : [];

  if (sessionType.id === "automotive" && normalizedDeliverables.length === 0) {
    return NextResponse.json({ error: "missing_deliverables" }, { status: 400 });
  }

  const estimatedSessionCents =
    sessionType.id === "automotive"
      ? estimateAutomotiveSessionCents(normalizedDeliverables)
      : null;

  const notes = composeBookingNotes({
    sessionTypeId: sessionType.id,
    deliverableIds: normalizedDeliverables,
    clientNotes,
    estimatedSessionCents,
  });

  if (!name || !email || !isValidEmail(email)) {
    return NextResponse.json({ error: "missing_contact" }, { status: 400 });
  }
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  if (!startsAt || isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: booking, error } = await admin
    .from("photo_bookings")
    .insert({
      email,
      name,
      session_type: sessionType.id,
      starts_at: startsAt.toISOString(),
      notes,
      deposit_amount_cents: sessionType.depositCents,
      status: "requested",
    })
    .select("id")
    .single();
  if (error || !booking) {
    console.error("[api/booking/request] insert failed", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const stripe = getStripe();
  const origin = request.nextUrl.origin;
  const auth = await getUserEmailFromRequest(request);

  // Notify owner either way so they can confirm availability.
  const ownerEmail = ownerNotificationEmail();
  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `New booking request · ${sessionType.label}`,
      html: `<p><strong>${name}</strong> (${email}) requested ${sessionType.label} for ${startsAt.toLocaleString()}.</p>
        ${notes ? `<p>${notes}</p>` : ""}
        <p>Deposit: $${(sessionType.depositCents / 100).toFixed(2)}</p>
        ${
          estimatedSessionCents != null
            ? `<p>Guide session subtotal: $${(estimatedSessionCents / 100).toFixed(2)}</p>`
            : ""
        }`,
    });
  }

  if (stripe) {
    try {
      const stripeDescription =
        sessionType.id === "automotive" && normalizedDeliverables.length > 0
          ? `Deposit for ${startsAt.toLocaleString()}. Deliverables: ${labelsForDeliverableIds(normalizedDeliverables).join(", ")}.${estimatedSessionCents != null ? ` Guide session subtotal $${(estimatedSessionCents / 100).toFixed(0)}.` : ""} Balance due on shoot day.`
          : `Deposit for ${startsAt.toLocaleString()}. Balance due on shoot day.`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: sessionType.depositCents,
              product_data: {
                name: `${sessionType.label} · deposit`,
                description: stripeDescription,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        success_url: `${origin}/photography/thank-you?session_id={CHECKOUT_SESSION_ID}&kind=booking`,
        cancel_url: `${origin}/photography/book?canceled=1`,
        metadata: {
          kind: "booking_deposit",
          booking_id: booking.id,
          session_type: sessionType.id,
          supabase_user_id: auth?.userId ?? "",
        },
      });
      return NextResponse.json({ url: session.url, booking_id: booking.id });
    } catch (err) {
      console.error("[api/booking/request] stripe failed", err);
    }
  }

  // Confirm to the requester that we got it even without Stripe.
  await sendEmail({
    to: email,
    subject: `Booking request received · ${PHOTO_BRAND.watermarkText}`,
    html: `<p>Thanks ${name} — I got your request for ${sessionType.label} on ${startsAt.toLocaleString()}.</p>
      <p>I'll reply soon to confirm availability and payment details.</p>`,
  });

  return NextResponse.json({ ok: true, booking_id: booking.id });
}
