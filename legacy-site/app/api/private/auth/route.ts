import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  signPrivateGalleryCookie,
} from "@/lib/photography-tokens";
import { PRIVATE_GALLERY_COOKIE_MAX_AGE_SEC } from "@/lib/photography-config";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now >= e.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > RATE_LIMIT_MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts — try again in a minute." },
      { status: 429 }
    );
  }

  let body: { slug?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const password = body.password ?? "";
  if (!slug || !password) {
    return NextResponse.json(
      { ok: false, error: "Password required" },
      { status: 400 }
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: gallery, error } = await admin
      .from("private_galleries")
      .select("id, slug, password_hash, expires_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!gallery) {
      return NextResponse.json(
        { ok: false, error: "Gallery not found" },
        { status: 404 }
      );
    }
    if (
      gallery.expires_at &&
      new Date(gallery.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { ok: false, error: "This gallery link has expired." },
        { status: 410 }
      );
    }
    const match = await bcrypt.compare(password, gallery.password_hash);
    if (!match) {
      return NextResponse.json(
        { ok: false, error: "Wrong password." },
        { status: 401 }
      );
    }
    const token = await signPrivateGalleryCookie(
      { slug: gallery.slug, gid: gallery.id },
      PRIVATE_GALLERY_COOKIE_MAX_AGE_SEC
    );
    const res = NextResponse.json({ ok: true });
    res.cookies.set(PRIVATE_GALLERY_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: PRIVATE_GALLERY_COOKIE_MAX_AGE_SEC,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[api/private/auth] failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PRIVATE_GALLERY_COOKIE_NAME);
  return res;
}
