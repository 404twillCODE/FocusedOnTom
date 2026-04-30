import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import { canAccessFile, getVaultDb, logVaultActivity } from "@/lib/vault/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const body = (await request.json()) as { fileId?: string };
    if (!body.fileId) return NextResponse.json({ error: "File id is required" }, { status: 400 });
    const access = await canAccessFile(auth.user, body.fileId, "upload");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { data, error } = await getVaultDb()
      .from("vault_files")
      .update({ upload_status: "ready" })
      .eq("id", body.fileId)
      .select("*")
      .single();
    if (error) throw error;
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: "file.uploaded",
      itemType: "file",
      fileId: body.fileId,
      metadata: { name: data.name, sizeBytes: data.size_bytes },
    });
    return NextResponse.json({ file: data });
  } catch (error) {
    console.error("[vault/files/complete] POST", error);
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 });
  }
}
