import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  verifyPrivateGalleryCookie,
} from "@/lib/photography-tokens";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;

  // Protect private gallery routes: require a signed cookie whose slug matches.
  if (pathname.startsWith("/photography/private/")) {
    const rest = pathname.slice("/photography/private/".length);
    const [rawSlug, ...tail] = rest.split("/");
    const slug = decodeURIComponent(rawSlug ?? "");
    const isLoginRoute = tail[0] === "login";
    if (slug && !isLoginRoute) {
      const cookie = request.cookies.get(PRIVATE_GALLERY_COOKIE_NAME)?.value;
      const claims = cookie ? await verifyPrivateGalleryCookie(cookie) : null;
      if (!claims || claims.slug !== slug) {
        const url = request.nextUrl.clone();
        url.pathname = `/photography/private/${encodeURIComponent(slug)}/login`;
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // Protect Supabase-backed app routes.
  const requiresSupabaseSession =
    (pathname.startsWith("/focusedonyou") && !pathname.startsWith("/focusedonyou/auth")) ||
    pathname.startsWith("/vault");

  if (requiresSupabaseSession) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.startsWith("/vault")
          ? "/photography/account"
          : "/focusedonyou/auth";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$).*)"],
};
