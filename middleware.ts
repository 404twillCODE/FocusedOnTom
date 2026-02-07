import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HOLDING_PATH = "/holding";
const PREVIEW_COOKIE = "fot_preview";
const PREVIEW_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const SKIP_PATHS = [
  HOLDING_PATH,
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/api",
];

function shouldSkip(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) return true;
  return SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const siteMode = process.env.NEXT_PUBLIC_SITE_MODE ?? "development";

  if (siteMode === "live") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const hasPreviewParam = url.searchParams.get("preview") === "1";
  const hasPreviewCookie = request.cookies.get(PREVIEW_COOKIE)?.value === "1";

  if (hasPreviewParam || hasPreviewCookie) {
    const res = NextResponse.next();
    if (hasPreviewParam) {
      res.cookies.set(PREVIEW_COOKIE, "1", {
        path: "/",
        maxAge: PREVIEW_COOKIE_MAX_AGE,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  }

  if (shouldSkip(url.pathname)) {
    return NextResponse.next();
  }

  url.pathname = HOLDING_PATH;
  url.searchParams.delete("preview");
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$).*)"],
};
