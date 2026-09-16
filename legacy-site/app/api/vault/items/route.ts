import { NextRequest, NextResponse } from "next/server";
import { requireVaultApiUser } from "@/lib/vault/auth";
import { getBreadcrumbs, listFolderTree, listVaultItems } from "@/lib/vault/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSort(value: string | null) {
  return value === "type" || value === "size" || value === "date" ? value : "name";
}

function getDirection(value: string | null) {
  return value === "desc" ? "desc" : "asc";
}

function getView(value: string | null) {
  return value === "shared" || value === "trash" ? value : "my";
}

export async function GET(request: NextRequest) {
  const auth = await requireVaultApiUser();
  if (!auth.user) return auth.response;
  try {
    const params = request.nextUrl.searchParams;
    const rawFolderId = params.get("folderId");
    const folderId = rawFolderId && rawFolderId !== "root" ? rawFolderId : null;
    const [items, tree, breadcrumbs] = await Promise.all([
      listVaultItems(auth.user, {
        folderId,
        q: params.get("q") ?? undefined,
        sort: getSort(params.get("sort")),
        direction: getDirection(params.get("direction")),
        view: getView(params.get("view")),
      }),
      listFolderTree(auth.user),
      getBreadcrumbs(auth.user, folderId),
    ]);
    return NextResponse.json({ ...items, tree, breadcrumbs, user: auth.user });
  } catch (error) {
    console.error("[vault/items] GET", error);
    return NextResponse.json({ error: "Failed to load vault" }, { status: 500 });
  }
}
