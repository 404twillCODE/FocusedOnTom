import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SiteUser } from "@/lib/auth/site-user";
import {
  isVaultPermission,
  permissionAllows,
  type VaultFile,
  type VaultFolder,
  type VaultItemType,
  type VaultPermission,
  type VaultPermissionRow,
} from "@/lib/vault/types";

type AccessResult =
  | { ok: true; ownerId: string; permission: VaultPermission | "owner" | "admin" }
  | { ok: false; status: number; error: string };

export function getVaultDb() {
  return getSupabaseAdmin();
}

export function normalizeVaultEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeVaultName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 180);
}

export async function logVaultActivity({
  actorId,
  ownerId,
  action,
  itemType,
  folderId,
  fileId,
  metadata = {},
}: {
  actorId: string;
  ownerId: string;
  action: string;
  itemType: VaultItemType | "share" | "system";
  folderId?: string | null;
  fileId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await getVaultDb().from("vault_activity_log").insert({
    actor_id: actorId,
    owner_id: ownerId,
    action,
    item_type: itemType,
    folder_id: folderId ?? null,
    file_id: fileId ?? null,
    metadata,
  });
}

async function getFolder(folderId: string) {
  const { data, error } = await getVaultDb()
    .from("vault_folders")
    .select("*")
    .eq("id", folderId)
    .maybeSingle();
  if (error) throw error;
  return data as VaultFolder | null;
}

async function getFile(fileId: string) {
  const { data, error } = await getVaultDb()
    .from("vault_files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;
  return data as VaultFile | null;
}

async function getFolderPermission(folderId: string, user: SiteUser) {
  const { data, error } = await getVaultDb()
    .from("vault_folder_permissions")
    .select("permission")
    .eq("folder_id", folderId)
    .or(`grantee_email.eq.${user.email},grantee_user_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const permission = (data as { permission?: unknown } | null)?.permission;
  return isVaultPermission(permission) ? permission : null;
}

async function getFilePermission(fileId: string, user: SiteUser) {
  const { data, error } = await getVaultDb()
    .from("vault_file_permissions")
    .select("permission")
    .eq("file_id", fileId)
    .or(`grantee_email.eq.${user.email},grantee_user_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const permission = (data as { permission?: unknown } | null)?.permission;
  return isVaultPermission(permission) ? permission : null;
}

export async function canAccessFolder(
  user: SiteUser,
  folderId: string | null | undefined,
  required: VaultPermission
): Promise<AccessResult> {
  if (!folderId) return { ok: true, ownerId: user.id, permission: "owner" };
  const folder = await getFolder(folderId);
  if (!folder) return { ok: false, status: 404, error: "Folder not found" };
  if (user.isAdmin) return { ok: true, ownerId: folder.owner_id, permission: "admin" };
  if (folder.owner_id === user.id) return { ok: true, ownerId: folder.owner_id, permission: "owner" };
  const permission = await getFolderPermission(folderId, user);
  if (!permission || !permissionAllows(permission, required)) {
    return { ok: false, status: 403, error: "You do not have access to this folder" };
  }
  return { ok: true, ownerId: folder.owner_id, permission };
}

export async function canAccessFile(
  user: SiteUser,
  fileId: string,
  required: VaultPermission
): Promise<(AccessResult & { file?: VaultFile })> {
  const file = await getFile(fileId);
  if (!file) return { ok: false, status: 404, error: "File not found" };
  if (user.isAdmin) return { ok: true, ownerId: file.owner_id, permission: "admin", file };
  if (file.owner_id === user.id) return { ok: true, ownerId: file.owner_id, permission: "owner", file };
  const direct = await getFilePermission(fileId, user);
  if (direct && permissionAllows(direct, required)) {
    return { ok: true, ownerId: file.owner_id, permission: direct, file };
  }
  if (file.folder_id) {
    const folder = await canAccessFolder(user, file.folder_id, required);
    if (folder.ok) return { ...folder, file };
  }
  return { ok: false, status: 403, error: "You do not have access to this file" };
}

export async function listVaultItems(
  user: SiteUser,
  options: {
    folderId?: string | null;
    q?: string;
    sort?: "name" | "type" | "size" | "date";
    direction?: "asc" | "desc";
    view?: "my" | "shared" | "trash";
  }
) {
  const db = getVaultDb();
  const folderId = options.folderId ?? null;
  const view = options.view ?? "my";
  const q = options.q?.trim();
  const includeTrash = view === "trash";

  let foldersQuery = db.from("vault_folders").select("*");
  let filesQuery = db.from("vault_files").select("*").eq("upload_status", "ready");

  if (view === "shared") {
    const [{ data: folderPerms }, { data: filePerms }] = await Promise.all([
      db
        .from("vault_folder_permissions")
        .select("folder_id")
        .or(`grantee_email.eq.${user.email},grantee_user_id.eq.${user.id}`),
      db
        .from("vault_file_permissions")
        .select("file_id")
        .or(`grantee_email.eq.${user.email},grantee_user_id.eq.${user.id}`),
    ]);
    const folderIds = [...new Set((folderPerms ?? []).map((p) => p.folder_id))];
    const fileIds = [...new Set((filePerms ?? []).map((p) => p.file_id))];
    foldersQuery =
      folderIds.length > 0
        ? foldersQuery.in("id", folderIds)
        : foldersQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    filesQuery =
      fileIds.length > 0
        ? filesQuery.in("id", fileIds)
        : filesQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  } else if (!user.isAdmin) {
    foldersQuery = foldersQuery.eq("owner_id", user.id);
    filesQuery = filesQuery.eq("owner_id", user.id);
  }

  if (view !== "shared") {
    foldersQuery = folderId ? foldersQuery.eq("parent_id", folderId) : foldersQuery.is("parent_id", null);
    filesQuery = folderId ? filesQuery.eq("folder_id", folderId) : filesQuery.is("folder_id", null);
  }

  foldersQuery = includeTrash ? foldersQuery.not("trashed_at", "is", null) : foldersQuery.is("trashed_at", null);
  filesQuery = includeTrash ? filesQuery.not("trashed_at", "is", null) : filesQuery.is("trashed_at", null);

  if (q) {
    foldersQuery = foldersQuery.ilike("name", `%${q}%`);
    filesQuery = filesQuery.or(`name.ilike.%${q}%,mime_type.ilike.%${q}%`);
  }

  const sort = options.sort ?? "name";
  const ascending = (options.direction ?? "asc") === "asc";
  const folderSortColumn = sort === "date" ? "created_at" : "name";
  const fileSortColumn = sort === "size" ? "size_bytes" : sort === "date" ? "created_at" : "name";

  const [{ data: folders, error: folderError }, { data: files, error: fileError }] =
    await Promise.all([
      foldersQuery.order(folderSortColumn, { ascending }),
      filesQuery.order(fileSortColumn, { ascending }),
    ]);
  if (folderError) throw folderError;
  if (fileError) throw fileError;
  return { folders: (folders ?? []) as VaultFolder[], files: (files ?? []) as VaultFile[] };
}

export async function listFolderTree(user: SiteUser) {
  let query = getVaultDb()
    .from("vault_folders")
    .select("*")
    .is("trashed_at", null)
    .order("name", { ascending: true });
  if (!user.isAdmin) query = query.eq("owner_id", user.id);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as VaultFolder[];
}

export async function getBreadcrumbs(user: SiteUser, folderId?: string | null) {
  const crumbs: VaultFolder[] = [];
  let currentId = folderId ?? null;
  const seen = new Set<string>();
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const access = await canAccessFolder(user, currentId, "view");
    if (!access.ok) break;
    const folder = await getFolder(currentId);
    if (!folder) break;
    crumbs.unshift(folder);
    currentId = folder.parent_id;
  }
  return crumbs;
}

export async function listPermissions(user: SiteUser, itemType: VaultItemType, id: string) {
  const access =
    itemType === "folder" ? await canAccessFolder(user, id, "manage") : await canAccessFile(user, id, "manage");
  if (!access.ok) return access;
  const table = itemType === "folder" ? "vault_folder_permissions" : "vault_file_permissions";
  const column = itemType === "folder" ? "folder_id" : "file_id";
  const { data, error } = await getVaultDb()
    .from(table)
    .select("*")
    .eq(column, id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { ok: true as const, permissions: (data ?? []) as VaultPermissionRow[] };
}
