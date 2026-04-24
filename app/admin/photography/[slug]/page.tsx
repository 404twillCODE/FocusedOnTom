"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminGate } from "@/components/admin/AdminGate";
import type { PrivateGalleryState } from "@/lib/photography-types";

type Data = {
  gallery: {
    id: string;
    slug: string;
    title: string;
    client_name: string | null;
    client_email: string | null;
    state: PrivateGalleryState;
    allow_all_zip: boolean;
    final_message: string | null;
  };
  favorites: Array<{ photo_path: string; note: string | null; submitted: boolean }>;
  finalPhotos: Array<{
    id: string;
    photo_path: string;
    is_final: boolean;
    final_url: string | null;
  }>;
};

const STATES: PrivateGalleryState[] = [
  "proofing",
  "editing",
  "final_delivery",
  "approved",
];

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <AdminGate>
      <Inner slug={slug} />
    </AdminGate>
  );
}

function Inner({ slug }: { slug: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [finalPath, setFinalPath] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [finalMessage, setFinalMessage] = useState("");

  const authHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-password": password,
    }),
    [password]
  );

  const reload = useCallback(async () => {
    try {
      const pw = sessionStorage.getItem("admin_password") ?? "";
      setPassword(pw);
      if (!pw) {
        setLoading(false);
        return;
      }
      const res = await fetch(
        `/api/admin/photography/galleries/${encodeURIComponent(slug)}`,
        { headers: { "x-admin-password": pw } }
      );
      const body = (await res.json()) as { ok?: boolean } & Data;
      if (res.ok && body.ok) {
        setData(body);
        setFinalMessage(body.gallery.final_message ?? "");
      } else {
        setError("Gallery not found");
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(
      `/api/admin/photography/galleries/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }
    );
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Failed");
      return;
    }
    await reload();
  }

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--textMuted)]" />
      </div>
    );
  if (!data) return <div className="p-8">Not found.</div>;

  const g = data.gallery;

  return (
    <main className="mx-auto max-w-4xl px-4 pt-24 pb-20 sm:px-6 sm:pt-28">
      <Link
        href="/admin/photography"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All galleries
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text)]">
        {g.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--textMuted)]">
        {g.slug} · {g.client_name ?? "–"} · {g.client_email ?? "–"}
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
          State
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patch({ state: s })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                g.state === s
                  ? "border-[var(--ice)]/60 bg-[var(--ice)]/15 text-[var(--ice)]"
                  : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:text-[var(--ice)]"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-[var(--textMuted)]">
          <input
            type="checkbox"
            checked={g.allow_all_zip}
            onChange={(e) => patch({ allow_all_zip: e.target.checked })}
          />
          Allow client to download ALL photos
        </label>
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.14em] text-[var(--textMuted)]">
            Final delivery message (shown with final ZIP)
          </label>
          <textarea
            value={finalMessage}
            onChange={(e) => setFinalMessage(e.target.value)}
            onBlur={() => {
              if (finalMessage !== (g.final_message ?? ""))
                void patch({ final_message: finalMessage });
            }}
            rows={3}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/60"
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
          Client favorites · {data.favorites.length}
        </h2>
        {data.favorites.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--textMuted)]">
            No selections yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1 text-xs text-[var(--textMuted)]">
            {data.favorites.map((f) => (
              <li
                key={f.photo_path}
                className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg3)]/40 px-2 py-1 font-mono"
              >
                <span className="truncate">{f.photo_path}</span>
                {f.submitted && (
                  <span className="ml-auto rounded-full border border-[var(--ice)]/30 bg-[var(--ice)]/10 px-2 py-0.5 text-[10px] text-[var(--ice)]">
                    submitted
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
          Final delivery files
        </h2>
        <p className="mt-1 text-xs text-[var(--textMuted)]">
          Paste the R2 key or full URL of each edited final image. These appear
          in the &ldquo;Final edits&rdquo; section of the client page.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            placeholder="R2 key (e.g. photography-originals/private/foo/edit-1.jpg)"
            value={finalPath}
            onChange={(e) => setFinalPath(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2 text-sm outline-none focus:border-[var(--ice)]/60"
          />
          <input
            placeholder="Public URL (optional, falls back to CDN)"
            value={finalUrl}
            onChange={(e) => setFinalUrl(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2 text-sm outline-none focus:border-[var(--ice)]/60"
          />
        </div>
        <button
          type="button"
          disabled={!finalPath}
          onClick={() => {
            void patch({
              add_final: {
                photo_path: finalPath.trim(),
                final_url: finalUrl.trim() || finalPath.trim(),
              },
            });
            setFinalPath("");
            setFinalUrl("");
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-1.5 text-xs font-medium text-[var(--ice)] hover:bg-[var(--ice)]/20 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add final
        </button>

        <ul className="mt-4 flex flex-col gap-2 text-xs">
          {data.finalPhotos.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-3 py-2"
            >
              <span className="truncate font-mono text-emerald-200">
                {f.photo_path}
              </span>
              <button
                type="button"
                onClick={() => patch({ remove_final: f.photo_path })}
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-rose-200"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
