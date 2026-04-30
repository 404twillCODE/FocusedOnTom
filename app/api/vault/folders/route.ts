import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import {
  canAccessFolder,
  getVaultDb,
  logVaultActivity,
  normalizeVaultName,
} from "@/lib/vault/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const body = (await request.json()) as { name?: string; parentId?: string | null };
    const name = normalizeVaultName(body.name ?? "");
    if (!name) return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    const parentId = body.parentId ?? null;
    const access = await canAccessFolder(auth.user, parentId, "upload");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const { data, error } = await getVaultDb()
      .from("vault_folders")
      .insert({ owner_id: access.ownerId, parent_id: parentId, name })
      .select("*")
      .single();
    if (error) throw error;
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: "folder.created",
      itemType: "folder",
      folderId: data.id,
      metadata: { name, parentId },
    });
    return NextResponse.json({ folder: data });
  } catch (error) {
    console.error("[vault/folders] POST", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
