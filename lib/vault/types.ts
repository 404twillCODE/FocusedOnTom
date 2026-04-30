export type VaultPermission = "view" | "download" | "upload" | "edit" | "manage";
export type VaultItemType = "folder" | "file";
export type VaultUploadStatus = "pending" | "ready" | "failed";

export type VaultFolder = {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  color: string | null;
  sort_order: number;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VaultFile = {
  id: string;
  owner_id: string;
  folder_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  r2_key: string;
  upload_status: VaultUploadStatus;
  checksum: string | null;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VaultPermissionRow = {
  id: string;
  owner_id: string;
  grantee_email: string;
  grantee_user_id: string | null;
  permission: VaultPermission;
  created_at: string;
  updated_at: string;
};

export const VAULT_PERMISSIONS: VaultPermission[] = [
  "view",
  "download",
  "upload",
  "edit",
  "manage",
];

const PERMISSION_RANK: Record<VaultPermission, number> = {
  view: 1,
  download: 2,
  upload: 3,
  edit: 4,
  manage: 5,
};

export function permissionAllows(
  actual: VaultPermission | null | undefined,
  required: VaultPermission
) {
  if (!actual) return false;
  return PERMISSION_RANK[actual] >= PERMISSION_RANK[required];
}

export function isVaultPermission(value: unknown): value is VaultPermission {
  return typeof value === "string" && VAULT_PERMISSIONS.includes(value as VaultPermission);
}
