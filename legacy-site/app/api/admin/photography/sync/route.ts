import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  getUserEmailFromRequest,
  isEmailAdmin,
} from "@/lib/supabase/admin";
import {
  fetchTeVisualsCatalog,
  getLastTeCatalogSnapshot,
  isTeVisualsSourceEnabled,
  TEVISUALS_CATALOG_TAG,
} from "@/lib/tevisuals/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Force-refresh the cached TE Visuals catalog.
 *
 * - Admin-only.
 * - Invalidates the `tevisuals:catalog` Next data-cache tag, then re-issues a
 *   `no-store` fetch so the next request paints with fresh data immediately.
 * - Returns the resulting source (`tevisuals` | `local-manifest`) plus a
 *   summary of how many tom-only galleries / photos were imported.
 */
export async function POST(request: NextRequest) {
  const auth = await getUserEmailFromRequest(request);
  if (!auth || !(await isEmailAdmin(auth.email))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isTeVisualsSourceEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: "tevisuals_source_disabled",
        hint:
          "Set PHOTOGRAPHY_SOURCE=tevisuals and TEVISUALS_BASE_URL in your env to enable.",
      },
      { status: 409 }
    );
  }

  const before = getLastTeCatalogSnapshot();

  // Invalidate tagged TE catalog fetch + photography pages + sitemap/feed so
  // deleted galleries/photos disappear (Data Cache + route cache paths that
  // embed `loadPhotographyData`).
  revalidateTag(TEVISUALS_CATALOG_TAG, "max");
  revalidatePath("/", "page"); // home calls `loadRecentPhotos` → TE catalog
  revalidatePath("/photography", "layout"); // /photography, /[category], /[category]/[event], …
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed/galleries.xml");

  // Pull a fresh copy now (no-store) so counts match what the next page load sees.
  const catalog = await fetchTeVisualsCatalog({ noCache: true });
  if (!catalog) {
    return NextResponse.json(
      {
        ok: false,
        error: "tevisuals_unreachable",
        hint:
          "TE Visuals returned no data. Pages will fall back to the bundled manifest until it recovers.",
      },
      { status: 502 }
    );
  }

  const totalPhotos = catalog.galleries.reduce(
    (acc, g) => acc + g.photos.length,
    0
  );

  console.info("[admin/photography/sync] TE catalog refresh", {
    beforeGalleries: before?.galleries ?? null,
    beforePhotos: before?.photos ?? null,
    afterGalleries: catalog.galleries.length,
    afterPhotos: totalPhotos,
    generatedAt: catalog.generatedAt,
  });

  return NextResponse.json({
    ok: true,
    source: "tevisuals",
    revalidatedTag: TEVISUALS_CATALOG_TAG,
    revalidatedPaths: [
      "/ (page)",
      "/photography (layout)",
      "/sitemap.xml",
      "/feed/galleries.xml",
    ],
    beforeGalleries: before?.galleries ?? null,
    beforePhotos: before?.photos ?? null,
    galleries: catalog.galleries.length,
    photos: totalPhotos,
    generatedAt: catalog.generatedAt,
  });
}

/** GET returns current source / cache status without forcing a refresh. */
export async function GET(request: NextRequest) {
  const auth = await getUserEmailFromRequest(request);
  if (!auth || !(await isEmailAdmin(auth.email))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    source: isTeVisualsSourceEnabled() ? "tevisuals" : "local-manifest",
    revalidateTag: TEVISUALS_CATALOG_TAG,
  });
}
