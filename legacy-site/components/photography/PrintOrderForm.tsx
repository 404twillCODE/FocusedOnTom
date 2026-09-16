"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatCents, PHOTO_BRAND } from "@/lib/photography-config";
import { trackEvent } from "@/lib/photography-analytics";
import type { PrintProduct } from "@/lib/photography-types";

type Props = {
  photoId: string;
  photoPath: string;
  photoUrl: string;
  product: PrintProduct;
};

export function PrintOrderForm({
  photoId,
  photoPath,
  photoUrl,
  product,
}: Props) {
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? "");
  const [paperId, setPaperId] = useState(product.papers[0]?.id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<null | { mailto: string }>(null);

  const selectedSize = product.sizes.find((s) => s.id === sizeId);
  const selectedPaper = product.papers.find((p) => p.id === paperId);
  const totalCents = useMemo(() => {
    return (selectedSize?.priceCents ?? 0) + (selectedPaper?.priceDeltaCents ?? 0);
  }, [selectedSize, selectedPaper]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !sizeId || !paperId || loading) return;
    setLoading(true);
    setError(null);
    setFallback(null);
    trackEvent("print_click", { photo_id: photoId, size_id: sizeId });
    try {
      const res = await fetch("/api/print/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_id: photoId,
          photo_path: photoPath,
          photo_url: photoUrl,
          size_id: sizeId,
          paper_id: paperId,
          buyer_name: name,
          buyer_email: email,
          notes,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        mailto?: string;
        error?: string;
      };
      if (res.status === 501 || data.error === "stripe_not_configured") {
        const subject = encodeURIComponent(
          `Print order: ${selectedSize?.label ?? sizeId} ${selectedPaper?.label ?? ""}`
        );
        const body = encodeURIComponent(
          `Hey Tom,\n\nI'd like to order this photo as a print:\n${photoUrl}\n\nName: ${name}\nEmail: ${email}\nSize: ${selectedSize?.label ?? sizeId}\nPaper: ${selectedPaper?.label ?? paperId}\nNotes: ${notes || "—"}\n`
        );
        const mailto = `mailto:${PHOTO_BRAND.contactEmail}?subject=${subject}&body=${body}`;
        setFallback({ mailto });
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
          Size
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {product.sizes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSizeId(s.id)}
              className={`rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                s.id === sizeId
                  ? "border-[var(--ice)]/70 bg-[var(--ice)]/10 text-[var(--ice)]"
                  : "border-[var(--border)] bg-[var(--bg3)]/40 text-[var(--textMuted)] hover:text-[var(--text)]"
              }`}
            >
              <div className="font-medium text-[var(--text)]">{s.label}</div>
              <div className="mt-1">{formatCents(s.priceCents)}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
          Paper / finish
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {product.papers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaperId(p.id)}
              className={`rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                p.id === paperId
                  ? "border-[var(--ice)]/70 bg-[var(--ice)]/10 text-[var(--ice)]"
                  : "border-[var(--border)] bg-[var(--bg3)]/40 text-[var(--textMuted)] hover:text-[var(--text)]"
              }`}
            >
              <div className="font-medium text-[var(--text)]">{p.label}</div>
              <div className="mt-1">
                {p.priceDeltaCents === 0
                  ? "Included"
                  : `+${formatCents(p.priceDeltaCents)}`}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
            Name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
            Email
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--textMuted)]">
          Notes (optional)
        </span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Framing preference, crop notes, delivery timeline…"
          className="mt-1 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50"
        />
      </label>

      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-3">
        <span className="text-sm text-[var(--textMuted)]">Total</span>
        <span className="text-lg font-semibold text-[var(--text)]">
          {formatCents(totalCents)}
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-3 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `Order print · ${formatCents(totalCents)}`
        )}
      </button>

      {fallback && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
          Online checkout isn&apos;t wired up yet. Email your order instead:{" "}
          <a href={fallback.mailto} className="font-medium text-amber-50 underline">
            send request
          </a>
          .
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
    </form>
  );
}
