import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import { canAccessFile, logVaultActivity } from "@/lib/vault/db";
import { presignVaultGet } from "@/lib/vault/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const { id } = await params;
    const mode = request.nextUrl.searchParams.get("mode") === "download" ? "download" : "preview";
    const access = await canAccessFile(auth.user, id, mode === "download" ? "download" : "view");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    if (!access.file || access.file.upload_status !== "ready") {
      return NextResponse.json({ error: "File is not ready" }, { status: 409 });
    }
    const url = await presignVaultGet({
      key: access.file.r2_key,
      filename: access.file.name,
      contentType: access.file.mime_type,
      disposition: mode === "download" ? "attachment" : "inline",
    });
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: mode === "download" ? "file.download_url.created" : "file.preview_url.created",
      itemType: "file",
      fileId: access.file.id,
      metadata: { mode },
    });
    return NextResponse.json({ url, expiresInSeconds: 300 });
  } catch (error) {
    console.error("[vault/files/signed-url] GET", error);
    return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
  }
}
