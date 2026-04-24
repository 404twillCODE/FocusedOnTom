import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { PHOTO_BRAND, PRINT_PRODUCT, formatCents } from "@/lib/photography-config";
import { getSupabaseAdmin, getUserEmailFromRequest } from "@/lib/supabase/admin";

type Body = {
  photo_id?: string;
  photo_path?: string;
  photo_url?: string;
  size_id?: string;
  paper_id?: string;
  buyer_name?: string;
  buyer_email?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const photoId = body.photo_id?.trim();
  const sizeId = body.size_id?.trim();
  const paperId = body.paper_id?.trim();
  const buyerName = body.buyer_name?.trim();
  const buyerEmail = body.buyer_email?.trim();

  if (!photoId || !sizeId || !paperId || !buyerName || !buyerEmail) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const size = PRINT_PRODUCT.sizes.find((s) => s.id === sizeId);
  const paper = PRINT_PRODUCT.papers.find((p) => p.id === paperId);
  if (!size || !paper) {
    return NextResponse.json({ error: "invalid_options" }, { status: 400 });
  }
  const amountCents = size.priceCents + paper.priceDeltaCents;

  const stripe = getStripe();
  if (!stripe) {
    // Log the intent so the owner can fulfill manually. The UI falls back
    // to a mailto link.
    try {
      const admin = getSupabaseAdmin();
      await admin.from("print_orders").insert({
        photo_id: photoId,
        photo_path: body.photo_path ?? "",
        size_id: sizeId,
        paper_id: paperId,
        amount_cents: amountCents,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: "pending",
      });
    } catch (e) {
      console.warn("[api/print/checkout] failed to log pending order", e);
    }
    return NextResponse.json(
      { error: "stripe_not_configured", mailto: PHOTO_BRAND.contactEmail },
      { status: 501 }
    );
  }

  const origin = request.nextUrl.origin;
  const auth = await getUserEmailFromRequest(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Print · ${size.label} · ${paper.label}`,
              description: `${formatCents(amountCents)} — archival giclée.`,
              images: body.photo_url ? [body.photo_url] : undefined,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: buyerEmail,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "SE"],
      },
      success_url: `${origin}/photography/thank-you?session_id={CHECKOUT_SESSION_ID}&kind=print`,
      cancel_url: `${origin}/photography/print/${photoId}?canceled=1`,
      metadata: {
        kind: "print_purchase",
        photo_id: photoId,
        photo_path: body.photo_path ?? "",
        photo_url: body.photo_url ?? "",
        size_id: sizeId,
        paper_id: paperId,
        buyer_name: buyerName,
        supabase_user_id: auth?.userId ?? "",
        notes: body.notes ?? "",
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[api/print/checkout] failed", err);
    return NextResponse.json(
      { error: "checkout_failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
