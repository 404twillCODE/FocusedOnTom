"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Download, Eye, FileArchive, FileText, Folder, FolderPlus, Image as ImageIcon, Loader2, Search, Share2, Shield, Sparkles, UploadCloud, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { VaultUser } from "@/lib/vault/auth";
import type { VaultFile, VaultFolder, VaultPermission, VaultPermissionRow } from "@/lib/vault/types";

type Tab = "my" | "photos" | "shared" | "trash";
type VaultItem = { type: "folder"; item: VaultFolder } | { type: "file"; item: VaultFile };
type VaultData = {
  folders: VaultFolder[];
  files: VaultFile[];
  tree: VaultFolder[];
  breadcrumbs: VaultFolder[];
};
type VaultPhoto = {
  id: string;
  gallery_slug: string;
  filename: string;
  public_url: string;
  width: number;
  height: number;
  original_size: number;
  created_at: string;
};

const permissionOptions: VaultPermission[] = ["view", "download", "upload", "edit", "manage"];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function fileKind(file: VaultFile) {
  if (file.mime_type.startsWith("image/")) return "image";
  if (file.mime_type.startsWith("video/")) return "video";
  if (file.mime_type === "application/pdf") return "pdf";
  if (file.mime_type.includes("zip") || file.mime_type.includes("archive")) return "archive";
  return "file";
}

function FileIcon({ file }: { file: VaultFile }) {
  const className = "h-6 w-6";
  const kind = fileKind(file);
  if (kind === "image") return <ImageIcon className={className} />;
  if (kind === "video") return <Video className={className} />;
  if (kind === "archive") return <FileArchive className={className} />;
  return <FileText className={className} />;
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

export function VaultDashboard({ initialUser }: { initialUser: VaultUser }) {
  const [tab, setTab] = useState<Tab>("my");
  const [data, setData] = useState<VaultData>({ folders: [], files: [], tree: [], breadcrumbs: [] });
  const [photos, setPhotos] = useState<VaultPhoto[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [shareItem, setShareItem] = useState<VaultItem | null>(null);
  const [preview, setPreview] = useState<{ title: string; url: string; kind: string; file?: VaultFile } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo<VaultItem[]>(
    () => [
      ...data.folders.map((item) => ({ type: "folder" as const, item })),
      ...data.files.map((item) => ({ type: "file" as const, item })),
    ],
    [data]
  );

  const loadVault = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "photos") {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const payload = await apiJson<{ photos: VaultPhoto[] }>(`/api/vault/photos?${params.toString()}`);
        setPhotos(payload.photos);
      } else {
        const params = new URLSearchParams({
          folderId: folderId ?? "root",
          view: tab === "trash" ? "trash" : tab === "shared" ? "shared" : "my",
          sort: "name",
          direction: "asc",
        });
        if (query.trim()) params.set("q", query.trim());
        const payload = await apiJson<VaultData>(`/api/vault/items?${params.toString()}`);
        setData(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault");
    } finally {
      setLoading(false);
    }
  }, [folderId, query, tab]);

  useEffect(() => {
    const timeout = window.setTimeout(loadVault, query ? 220 : 0);
    return () => window.clearTimeout(timeout);
  }, [loadVault, query]);

  function switchTab(next: Tab) {
    setTab(next);
    setFolderId(null);
    setQuery("");
  }

  async function createFolder(name: string) {
    setBusy(true);
    try {
      await apiJson("/api/vault/folders", {
        method: "POST",
        body: JSON.stringify({ name, parentId: folderId }),
      });
      setCreateOpen(false);
      await loadVault();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files);
    if (selected.length === 0) return;
    setBusy(true);
    setError("");
    try {
      for (const file of selected) {
        const signed = await apiJson<{ fileId: string; uploadUrl: string }>("/api/vault/files/upload-url", {
          method: "POST",
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            folderId,
          }),
        });
        const upload = await fetch(signed.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!upload.ok) throw new Error(`Upload failed for ${file.name}`);
        await apiJson("/api/vault/files/complete", {
          method: "POST",
          body: JSON.stringify({ fileId: signed.fileId }),
        });
      }
      await loadVault();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function updateItem(item: VaultItem, action: "rename" | "move" | "trash" | "restore") {
    const payload: Record<string, string | null> = { action };
    if (action === "rename") {
      const nextName = window.prompt("New name", item.item.name);
      if (!nextName) return;
      payload.name = nextName;
    }
    if (action === "move") {
      const nextId = window.prompt("Destination folder id. Leave blank for root.", folderId ?? "");
      payload[item.type === "folder" ? "parentId" : "folderId"] = nextId?.trim() || null;
    }
    setBusy(true);
    try {
      await apiJson(`/api/vault/items/${item.type}/${item.item.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await loadVault();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setBusy(false);
    }
  }

  async function signedFile(file: VaultFile, mode: "preview" | "download") {
    const { url } = await apiJson<{ url: string }>(`/api/vault/files/${file.id}/signed-url?mode=${mode}`);
    return url;
  }

  async function previewFile(file: VaultFile) {
    setBusy(true);
    try {
      const url = await signedFile(file, "preview");
      setPreview({ title: file.name, url, kind: fileKind(file), file });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview file");
    } finally {
      setBusy(false);
    }
  }

  async function downloadFile(file: VaultFile) {
    const url = await signedFile(file, "download");
    window.location.href = url;
  }

  async function previewPhoto(photo: VaultPhoto) {
    setBusy(true);
    try {
      const { url } = await apiJson<{ url: string }>(`/api/vault/photos/${photo.id}/signed-url`);
      setPreview({ title: photo.filename, url, kind: "image" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview original");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPhoto(photo: VaultPhoto) {
    const { url } = await apiJson<{ url: string }>(`/api/vault/photos/${photo.id}/signed-url`);
    window.location.href = url;
  }

  const tabs: Array<[Tab, string]> = [
    ["my", "My Vault"],
    ["photos", "Photo Originals"],
    ["shared", "Shared With Me"],
    ["trash", "Trash"],
  ];

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/[0.09] bg-white/[0.055] shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <header className="border-b border-white/[0.08] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--ice)]/25 bg-[var(--iceSoft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-[var(--ice)]">
                  Private vault
                </span>
                {initialUser.isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                    <Shield className="h-3.5 w-3.5" />
                    Site owner
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                FocusedOnTom Vault
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--textMuted)]">
                Upload anything, organize folders, share by email, and manage synced photo originals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
              {tab === "my" ? (
                <>
                  <Button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2">
                    <FolderPlus className="h-4 w-4" /> New folder
                  </Button>
                  <Button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 border-[var(--ice)]/30 bg-[var(--iceSoft)] text-[var(--ice)]">
                    <UploadCloud className="h-4 w-4" /> Upload
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <div className="border-b border-white/[0.08] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    tab === id
                      ? "border-[var(--ice)]/40 bg-[var(--iceSoft)] text-[var(--ice)]"
                      : "border-white/10 bg-white/[0.04] text-[var(--textMuted)] hover:text-[var(--text)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--textMuted)]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vault" className="w-full pl-9" />
            </label>
          </div>
        </div>

        <section
          className={cn("relative min-h-[620px] p-4 sm:p-6", dragging && "bg-[var(--iceSoft)]")}
          onDragOver={(event) => {
            if (tab !== "my") return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            if (tab !== "my") return;
            event.preventDefault();
            setDragging(false);
            uploadFiles(event.dataTransfer.files);
          }}
        >
          {error ? <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
          {(loading || busy) ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/35 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-[var(--text)]">
                <Loader2 className="h-4 w-4 animate-spin" /> {loading ? "Loading" : "Working"}
              </span>
            </div>
          ) : null}

          {tab === "photos" ? (
            photos.length === 0 && !loading ? (
              <EmptyState title="No synced photo originals yet" body="Run npm run photos:sync after applying the photo schema." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo) => (
                  <article key={photo.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.055]">
                    <div className="aspect-[4/3] bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.public_url} alt={photo.filename} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-medium text-[var(--text)]">{photo.filename}</p>
                      <p className="mt-1 text-xs text-[var(--textMuted)]">{photo.gallery_slug} · {formatBytes(photo.original_size)}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button type="button" onClick={() => previewPhoto(photo)} className="text-xs"><Eye className="mr-1 inline h-3.5 w-3.5" />Preview</Button>
                        <Button type="button" onClick={() => downloadPhoto(photo)} className="text-xs"><Download className="mr-1 inline h-3.5 w-3.5" />Original</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : items.length === 0 && !loading ? (
            <EmptyState
              title={tab === "shared" ? "Nothing shared with you yet" : tab === "trash" ? "Trash is empty" : "Your vault is ready"}
              body={tab === "my" ? "Create a folder or upload any file type. Files are stored exactly as uploaded." : "Items will appear here when available."}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((entry) => (
                <article key={`${entry.type}-${entry.item.id}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.055] p-4">
                  <button
                    type="button"
                    onClick={() => entry.type === "folder" ? setFolderId(entry.item.id) : previewFile(entry.item)}
                    className="flex w-full min-w-0 items-center gap-3 text-left"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-[var(--bg3)] text-[var(--ice)]">
                      {entry.type === "folder" ? <Folder className="h-6 w-6" /> : <FileIcon file={entry.item} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[var(--text)]">{entry.item.name}</span>
                      <span className="mt-1 block text-xs text-[var(--textMuted)]">
                        {entry.type === "folder" ? "Folder" : `${entry.item.mime_type} · ${formatBytes(entry.item.size_bytes)}`}
                      </span>
                    </span>
                  </button>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {entry.type === "folder" ? (
                      <Button type="button" onClick={() => setFolderId(entry.item.id)} className="text-xs">Open</Button>
                    ) : (
                      <>
                        <Button type="button" onClick={() => previewFile(entry.item)} className="text-xs">Preview</Button>
                        <Button type="button" onClick={() => downloadFile(entry.item)} className="text-xs">Download</Button>
                      </>
                    )}
                    <Button type="button" onClick={() => setShareItem(entry)} className="text-xs"><Share2 className="mr-1 inline h-3.5 w-3.5" />Share</Button>
                    <Button type="button" onClick={() => updateItem(entry, "rename")} className="text-xs">Rename</Button>
                    <Button type="button" onClick={() => updateItem(entry, "move")} className="text-xs">Move</Button>
                    <Button type="button" onClick={() => updateItem(entry, tab === "trash" ? "restore" : "trash")} className="text-xs">{tab === "trash" ? "Restore" : "Trash"}</Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {dragging ? (
            <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--ice)]/50 bg-[var(--bg)]/60 text-[var(--ice)] backdrop-blur-sm">
              <div className="text-center"><UploadCloud className="mx-auto h-10 w-10" /><p className="mt-2 font-medium">Drop files to upload originals</p></div>
            </div>
          ) : null}
        </section>
      </div>

      <CreateFolderModal open={createOpen} busy={busy} onClose={() => setCreateOpen(false)} onCreate={createFolder} />
      <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      <PreviewModal preview={preview} onClose={() => setPreview(null)} onDownload={preview?.file ? () => downloadFile(preview.file!) : undefined} />
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/[0.12] bg-white/[0.035] p-8 text-center">
      <div><Sparkles className="mx-auto h-10 w-10 text-[var(--ice)]" /><h2 className="mt-4 text-xl font-semibold text-[var(--text)]">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-[var(--textMuted)]">{body}</p></div>
    </div>
  );
}

function CreateFolderModal({ open, busy, onClose, onCreate }: { open: boolean; busy: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  if (!open) return null;
  return (
    <Modal title="Create folder" onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onCreate(name); }} className="space-y-4">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Folder name" autoFocus />
        <div className="flex justify-end gap-2"><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !name.trim()}>Create</Button></div>
      </form>
    </Modal>
  );
}

function ShareModal({ item, onClose }: { item: VaultItem | null; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<VaultPermission>("view");
  const [permissions, setPermissions] = useState<VaultPermissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadShares = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ itemType: item.type, id: item.item.id });
      const payload = await apiJson<{ permissions: VaultPermissionRow[] }>(`/api/vault/share?${params.toString()}`);
      setPermissions(payload.permissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shares");
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => { void loadShares(); }, [loadShares]);
  if (!item) return null;

  async function share() {
    setLoading(true);
    try {
      await apiJson("/api/vault/share", { method: "POST", body: JSON.stringify({ itemType: item!.type, id: item!.item.id, email, permission }) });
      setEmail("");
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share item");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    setLoading(true);
    try {
      await apiJson(`/api/vault/share/${id}`, { method: "DELETE" });
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke share");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Share ${item.item.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@example.com" type="email" />
          <select value={permission} onChange={(event) => setPermission(event.target.value as VaultPermission)} className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] outline-none">
            {permissionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <Button type="button" onClick={share} disabled={loading || !email.trim()}>Share</Button>
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035]">
          {permissions.length === 0 ? <p className="p-4 text-sm text-[var(--textMuted)]">{loading ? "Loading shares..." : "No one has access yet."}</p> : permissions.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 last:border-b-0">
              <div className="min-w-0"><p className="truncate text-sm text-[var(--text)]">{row.grantee_email}</p><p className="text-xs text-[var(--textMuted)]">{row.permission} access</p></div>
              <Button type="button" onClick={() => revoke(row.id)} disabled={loading}>Revoke</Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function PreviewModal({ preview, onClose, onDownload }: { preview: { title: string; url: string; kind: string } | null; onClose: () => void; onDownload?: () => void }) {
  if (!preview) return null;
  return (
    <Modal title={preview.title} onClose={onClose} wide>
      <div className="min-h-[55vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30">
        {preview.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt={preview.title} className="h-[70vh] w-full object-contain" />
        ) : preview.kind === "video" ? (
          <video src={preview.url} controls className="h-[70vh] w-full bg-black object-contain" />
        ) : preview.kind === "pdf" ? (
          <iframe title={preview.title} src={preview.url} className="h-[70vh] w-full" />
        ) : (
          <div className="flex h-[55vh] flex-col items-center justify-center p-6 text-center"><FileText className="h-10 w-10 text-[var(--ice)]" /><h3 className="mt-4 text-lg font-semibold text-[var(--text)]">Preview unavailable</h3></div>
        )}
      </div>
      {onDownload ? <div className="mt-4 flex justify-end"><Button type="button" onClick={onDownload}>Download</Button></div> : null}
    </Modal>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className={cn("max-h-[92vh] w-full overflow-auto rounded-[1.5rem] border border-white/[0.1] bg-[rgba(8,16,28,0.98)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.55)]", wide ? "max-w-5xl" : "max-w-lg")}>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="min-w-0 truncate text-lg font-semibold text-[var(--text)]">{title}</h2><button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--textMuted)] hover:text-[var(--text)]">Close</button></div>
        {children}
      </div>
    </div>
  );
}
