import { NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import { canAccessFile, canAccessFolder, getVaultDb, logVaultActivity } from "@/lib/vault/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const { id } = await params;
    const db = getVaultDb();
    const { data: folderPermission } = await db
      .from("vault_folder_permissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const { data: filePermission } = folderPermission
      ? { data: null }
      : await db.from("vault_file_permissions").select("*").eq("id", id).maybeSingle();
    const permission = folderPermission ?? filePermission;
    if (!permission) return NextResponse.json({ error: "Share not found" }, { status: 404 });
    const itemType = folderPermission ? "folder" : "file";
    const itemId = folderPermission ? permission.folder_id : permission.file_id;
    const access =
      itemType === "folder"
        ? await canAccessFolder(auth.user, itemId, "manage")
        : await canAccessFile(auth.user, itemId, "manage");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const table = itemType === "folder" ? "vault_folder_permissions" : "vault_file_permissions";
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) throw error;
    await db
      .from("vault_share_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq(itemType === "folder" ? "folder_id" : "file_id", itemId)
      .eq("grantee_email", permission.grantee_email);
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: "share.revoked",
      itemType: "share",
      folderId: itemType === "folder" ? itemId : null,
      fileId: itemType === "file" ? itemId : null,
      metadata: { email: permission.grantee_email },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[vault/share/id] DELETE", error);
    return NextResponse.json({ error: "Failed to revoke share" }, { status: 500 });
  }
}
