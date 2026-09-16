import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import {
  canAccessFile,
  canAccessFolder,
  getVaultDb,
  listPermissions,
  logVaultActivity,
  normalizeVaultEmail,
} from "@/lib/vault/db";
import { isVaultPermission, type VaultItemType } from "@/lib/vault/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getItemType(value: string | null): VaultItemType | null {
  return value === "folder" || value === "file" ? value : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const itemType = getItemType(request.nextUrl.searchParams.get("itemType"));
    const id = request.nextUrl.searchParams.get("id");
    if (!itemType || !id) return NextResponse.json({ error: "Item type and id are required" }, { status: 400 });
    const result = await listPermissions(auth.user, itemType, id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ permissions: result.permissions });
  } catch (error) {
    console.error("[vault/share] GET", error);
    return NextResponse.json({ error: "Failed to load shares" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const body = (await request.json()) as {
      itemType?: VaultItemType;
      id?: string;
      email?: string;
      permission?: unknown;
    };
    const itemType = getItemType(body.itemType ?? null);
    const id = body.id;
    const email = normalizeVaultEmail(body.email ?? "");
    if (!itemType || !id || !email || !isVaultPermission(body.permission)) {
      return NextResponse.json({ error: "Valid share details are required" }, { status: 400 });
    }
    const access = itemType === "folder" ? await canAccessFolder(auth.user, id, "manage") : await canAccessFile(auth.user, id, "manage");
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const db = getVaultDb();
    const { data: profile } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
    const table = itemType === "folder" ? "vault_folder_permissions" : "vault_file_permissions";
    const itemColumn = itemType === "folder" ? "folder_id" : "file_id";
    const { data, error } = await db
      .from(table)
      .upsert(
        {
          [itemColumn]: id,
          owner_id: access.ownerId,
          grantee_email: email,
          grantee_user_id: (profile as { id?: string } | null)?.id ?? null,
          permission: body.permission,
          created_by: auth.user.id,
        },
        { onConflict: `${itemColumn},grantee_email` }
      )
      .select("*")
      .single();
    if (error) throw error;
    await db.from("vault_share_invites").insert({
      owner_id: access.ownerId,
      grantee_email: email,
      item_type: itemType,
      folder_id: itemType === "folder" ? id : null,
      file_id: itemType === "file" ? id : null,
      permission: body.permission,
    });
    await logVaultActivity({
      actorId: auth.user.id,
      ownerId: access.ownerId,
      action: "share.upserted",
      itemType: "share",
      folderId: itemType === "folder" ? id : null,
      fileId: itemType === "file" ? id : null,
      metadata: { email, permission: body.permission },
    });
    return NextResponse.json({ permission: data });
  } catch (error) {
    console.error("[vault/share] POST", error);
    return NextResponse.json({ error: "Failed to update share" }, { status: 500 });
  }
}
