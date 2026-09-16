import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserEmailFromRequest } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  name?: string;
  props?: Record<string, unknown>;
  anon_id?: string;
  path?: string;
};

const ALLOWED_NAMES = new Set([
  "photo_view",
  "lightbox_open",
  "photo_like",
  "photo_favorite",
  "buy_click",
  "license_click",
  "print_click",
  "book_click",
  "private_login",
  "private_favorite",
  "private_submit",
  "private_approve",
  "newsletter_subscribe",
  "rss_click",
]);

export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  if (!name || !ALLOWED_NAMES.has(name)) {
    // Accept to avoid noisy 4xx, but don't store unknown events.
    return NextResponse.json({ ok: true });
  }

  try {
    const admin = getSupabaseAdmin();
    const auth = await getUserEmailFromRequest(request).catch(() => null);
    const cleanProps: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.props ?? {})) {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null
      ) {
        cleanProps[k] = v;
      }
    }
    await admin.from("photo_analytics_events").insert({
      name,
      props: cleanProps,
      anon_id: body.anon_id ?? null,
      user_id: auth?.userId ?? null,
      path: body.path ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/analytics/event] insert failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
