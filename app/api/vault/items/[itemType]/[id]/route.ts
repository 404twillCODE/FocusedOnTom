import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import {
  canAccessFile,
  canAccessFolder,
  getVaultDb,
  logVaultActivity,
  normalizeVaultName,
} from "@/lib/vault/db";
import type { VaultItemType } from "@/lib/vault/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTarget(itemType: string): VaultItemType | null {
  return itemType === "folder" || itemType === "file" ? itemType : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemType: string; id: string }> }
) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const { itemType, id } = await params;
    const target = getTarget(itemType);
    if (!target) return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    const body = (await request.json()) as {
      action?: "rename" | "move" | "trash" | "restore";
      name?: string;
      parentId?: string | null;
      folderId?: string | null;
    };
    const access = target === "folder" ? await canAccessFolder(auth.user, id, "edit") : await canAccessFile(auth.user, id, "edit");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const updates: Record<string, string | null> = {};
    if (body.action === "rename") {
      const name = normalizeVaultName(body.name ?? "");
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      updates.name = name;
    } else if (body.action === "move") {
      updates[target === "folder" ? "parent_id" : "folder_id"] =
        (target === "folder" ? body.parentId : body.folderId) ?? null;
    } else if (body.action === "trash") {
      updates.trashed_at = new Date().toISOString();
    } else if (body.action === "restore") {
      updates.trashed_at = null;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const table = target === "folder" ? "vault_folders" : "vault_files";
    const { data, error } = await getVaultDb().from(table).update(updates).eq("id", id).select("*").single();
    if (error) throw error;
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: `${target}.${body.action}`,
      itemType: target,
      folderId: target === "folder" ? id : null,
      fileId: target === "file" ? id : null,
      metadata: updates,
    });
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("[vault/items/id] PATCH", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
