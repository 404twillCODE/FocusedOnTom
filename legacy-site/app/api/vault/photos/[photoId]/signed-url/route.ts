import { NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import { getCanonicalPhoto } from "@/lib/photo-access";
import { presignR2GetFromBucket } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  if (!auth.user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { photoId } = await params;
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

  return NextResponse.json({ url, expiresInSeconds: 180 });
}
