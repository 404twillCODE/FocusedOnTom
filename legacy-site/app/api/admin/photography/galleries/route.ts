import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function checkAdmin(req: NextRequest): boolean {
  const password = process.env.ADMIN_GATE_PASSWORD ?? process.env.WORKOUT_GATE_PASSWORD;
  if (!password) return false;
  const provided = req.headers.get("x-admin-password") ?? "";
  return provided === password;
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("private_galleries")
      .select(
        "id, slug, title, client_name, client_email, state, allow_all_zip, created_at, expires_at"
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, galleries: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

type CreateBody = {
  slug?: string;
  title?: string;
  client_name?: string;
  client_email?: string;
  password?: string;
  allow_all_zip?: boolean;
  expires_days?: number;
};

export async function POST(request: NextRequest) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: CreateBody = {};
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const slug = body.slug?.trim();
  const title = body.title?.trim() || slug;
  const password = body.password?.trim() || generateFriendlyPassword();
  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "slug required" },
      { status: 400 }
    );
  }
  try {
    const admin = getSupabaseAdmin();
    const password_hash = await bcrypt.hash(password, 10);
    const expires_at = body.expires_days
      ? new Date(Date.now() + body.expires_days * 86400_000).toISOString()
      : null;
    const { data, error } = await admin
      .from("private_galleries")
      .insert({
        slug,
        title,
        client_name: body.client_name ?? null,
        client_email: body.client_email ?? null,
        password_hash,
        allow_all_zip: body.allow_all_zip ?? false,
        expires_at,
      })
      .select("id, slug, title")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, gallery: data, password });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

function generateFriendlyPassword(): string {
  const words = ["ember", "ridge", "amber", "coast", "drift", "quartz", "harbor", "blaze"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}
