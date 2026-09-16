import { NextRequest, NextResponse } from "next/server";
import { getUserEmailFromRequest } from "@/lib/supabase/admin";
import { canAccessOriginal, getCanonicalPhoto } from "@/lib/photo-access";
import { presignR2GetFromBucket } from "@/lib/r2";
import { isTeVisualsSourceEnabled } from "@/lib/tevisuals/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const auth = await getUserEmailFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { photoId } = await params;

  if (isTeVisualsSourceEnabled()) {
    return NextResponse.json(
      {
        error: "tevisuals_download_on_te_visuals_only",
        message:
          "FocusedOnTom hosts the TE Visuals gallery only. Download purchases from TE Visuals (account → downloads).",
        source: "tevisuals",
      },
      { status: 410 }
    );
  }

  const access = await canAccessOriginal(auth, photoId);
  if (!access.allowed) {
    return NextResponse.json({ error: "not_purchased" }, { status: 403 });
  }

  const photo = await getCanonicalPhoto(photoId);
  if (!photo) {
    return NextResponse.json({ error: "photo_not_found" }, { status: 404 });
  }

  const url = await presignR2GetFromBucket(
    photo.original_key,
    "private",
    60 * 3,
    photo.filename
  );
  if (!url) {
    return NextResponse.json({ error: "file_unavailable" }, { status: 500 });
  }

  return NextResponse.json({ url, expiresInSeconds: 180, access: access.reason });
}
