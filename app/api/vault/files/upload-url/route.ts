import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import {
  canAccessFolder,
  getVaultDb,
  logVaultActivity,
  normalizeVaultName,
} from "@/lib/vault/db";
import { makeVaultObjectKey, presignVaultPut } from "@/lib/vault/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const body = (await request.json()) as {
      name?: string;
      mimeType?: string;
      sizeBytes?: number;
      folderId?: string | null;
    };
    const name = normalizeVaultName(body.name ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const mimeType = body.mimeType?.trim() || "application/octet-stream";
    if (!name || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
      return NextResponse.json({ error: "Valid file metadata is required" }, { status: 400 });
    }
    const folderId = body.folderId ?? null;
    const access = await canAccessFolder(auth.user, folderId, "upload");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const db = getVaultDb();
    const { data: pendingFile, error: insertError } = await db
      .from("vault_files")
      .insert({
        owner_id: access.ownerId,
        folder_id: folderId,
        name,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        r2_key: `pending/${crypto.randomUUID()}`,
        upload_status: "pending",
      })
      .select("id")
      .single();
    if (insertError) throw insertError;
    const key = makeVaultObjectKey(access.ownerId, pendingFile.id, name);
    const { error: updateError } = await db.from("vault_files").update({ r2_key: key }).eq("id", pendingFile.id);
    if (updateError) throw updateError;
    const uploadUrl = await presignVaultPut({ key, contentType: mimeType });
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: "file.upload_url.created",
      itemType: "file",
      fileId: pendingFile.id,
      metadata: { name, folderId, sizeBytes, mimeType },
    });
    return NextResponse.json({ fileId: pendingFile.id, key, uploadUrl, expiresInSeconds: 600 });
  } catch (error) {
    console.error("[vault/files/upload-url] POST", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
