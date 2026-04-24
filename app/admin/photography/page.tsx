"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Loader2, Plus } from "lucide-react";
import { AdminGate } from "@/components/admin/AdminGate";

type Gallery = {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
  state: string;
  allow_all_zip: boolean;
  created_at: string;
  expires_at: string | null;
};

export default function AdminPhotographyPage() {
  return (
    <AdminGate>
      <Inner />
    </AdminGate>
  );
}

function Inner() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    client_name: "",
    client_email: "",
    password: "",
    allow_all_zip: false,
    expires_days: 30,
  });
  const [createdInfo, setCreatedInfo] = useState<{
    slug: string;
    password: string;
  } | null>(null);

  const reload = useCallback(async () => {
    try {
      const pw = sessionStorage.getItem("admin_password") ?? "";
      if (!pw) {
        setPassword("");
        setLoading(false);
        return;
      }
      setPassword(pw);
      const res = await fetch("/api/admin/photography/galleries", {
        headers: { "x-admin-password": pw },
      });
      const data = (await res.json()) as {
        ok?: boolean;
        galleries?: Gallery[];
      };
      if (res.ok && data.ok) setGalleries(data.galleries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function syncPassword() {
    const pw = window.prompt("Admin password (server verifies)") ?? "";
    if (!pw) return;
    sessionStorage.setItem("admin_password", pw);
    setPassword(pw);
    setLoading(true);
    await reload();
  }

  async function createGallery(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/photography/galleries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        password?: string;
        gallery?: { slug: string };
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setCreatedInfo({
        slug: data.gallery?.slug ?? form.slug,
        password: data.password ?? "(unchanged)",
      });
      setForm((f) => ({ ...f, slug: "", title: "", password: "" }));
      await reload();
    } finally {
      setCreating(false);
    }
  }

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--textMuted)]" />
      </div>
    );

  if (!password)
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 pt-24">
        <p className="text-sm text-[var(--textMuted)]">
          One more step — confirm your admin password so we can talk to the API.
        </p>
        <button
          type="button"
          onClick={syncPassword}
          className="mt-4 rounded-lg border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-4 py-2 text-sm font-medium text-[var(--ice)] hover:bg-[var(--ice)]/20"
        >
          Enter password
        </button>
      </div>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 sm:px-6 sm:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
            Photography admin
          </h1>
          <p className="mt-1 text-sm text-[var(--textMuted)]">
            Private galleries, bookings, analytics.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href="/admin/photography/bookings"
            className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-[var(--textMuted)] hover:text-[var(--ice)]"
          >
            Bookings
          </Link>
          <Link
            href="/admin/photography/analytics"
            className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-[var(--textMuted)] hover:text-[var(--ice)]"
          >
            Analytics
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
          <Plus className="h-3.5 w-3.5" />
          New private gallery
        </h2>
        <p className="mt-1 text-xs text-[var(--textMuted)]">
          The <code>slug</code> must match the folder name under{" "}
          <code>photography/private/&lt;slug&gt;/</code>. Run{" "}
          <code>npm run photos:sync</code> first so the photos are on R2.
        </p>
        <form
          onSubmit={createGallery}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <Field
            label="Slug (folder name)"
            value={form.slug}
            onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
          />
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          />
          <Field
            label="Client name"
            value={form.client_name}
            onChange={(v) => setForm((f) => ({ ...f, client_name: v }))}
          />
          <Field
            label="Client email"
            value={form.client_email}
            onChange={(v) => setForm((f) => ({ ...f, client_email: v }))}
          />
          <Field
            label="Password (blank = auto)"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          />
          <Field
            label="Expires in days (0 = never)"
            type="number"
            value={String(form.expires_days)}
            onChange={(v) =>
              setForm((f) => ({ ...f, expires_days: Number(v) || 0 }))
            }
          />
          <label className="flex items-center gap-2 text-xs text-[var(--textMuted)]">
            <input
              type="checkbox"
              checked={form.allow_all_zip}
              onChange={(e) =>
                setForm((f) => ({ ...f, allow_all_zip: e.target.checked }))
              }
            />
            Allow client to download ALL photos (ZIP)
          </label>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 text-sm font-medium text-[var(--ice)] hover:bg-[var(--ice)]/20 disabled:opacity-60 sm:col-span-2"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create gallery"}
          </button>
          {error && (
            <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:col-span-2">
              {error}
            </div>
          )}
          {createdInfo && (
            <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 sm:col-span-2">
              Gallery <b>{createdInfo.slug}</b> created.
              <div className="mt-1 flex items-center gap-2">
                Password:&nbsp;
                <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-emerald-200">
                  {createdInfo.password}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(createdInfo.password)
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
          Galleries
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {galleries.length === 0 && (
            <li className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-4 py-6 text-center text-sm text-[var(--textMuted)]">
              No galleries yet.
            </li>
          )}
          {galleries.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium text-[var(--text)]">
                  {g.title}
                </div>
                <div className="mt-1 text-xs text-[var(--textMuted)]">
                  {g.slug} · {g.client_name ?? "–"} · {g.client_email ?? "–"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-0.5 uppercase tracking-[0.14em] text-[var(--textMuted)]">
                  {g.state}
                </span>
                <Link
                  href={`/admin/photography/${encodeURIComponent(g.slug)}`}
                  className="rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-3 py-1 text-[var(--ice)] hover:bg-[var(--ice)]/20"
                >
                  Manage
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg3)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/60"
      />
    </label>
  );
}
