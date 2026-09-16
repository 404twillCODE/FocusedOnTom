"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DecImportDataset } from "@/lib/explore/importers/dec/types";

type Card = {
  dataset: DecImportDataset;
  title: string;
  count: number;
  lastImported?: string | null;
};

export function OfficialImports({
  cards,
  logs,
}: {
  cards: Card[];
  logs: Array<{
    id: string;
    status: string;
    started_at: string;
    records_created: number;
    records_updated: number;
    records_skipped: number;
    records_failed: number;
    records_received: number;
    error_message: string | null;
    metadata_json: { dataset?: string } | null;
  }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(dataset: DecImportDataset, title: string) {
    if (
      !window.confirm(
        `Import ${title} for the Adirondack Park? Existing personal visits, photos, and status will not be overwritten.`
      )
    ) {
      return;
    }
    setBusy(dataset);
    setMessage(null);
    try {
      const res = await fetch("/api/explore/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      setMessage(
        `${title}: ${json.status} — created ${json.recordsCreated}, updated ${json.recordsUpdated}, skipped ${json.recordsSkipped}, failed ${json.recordsFailed}`
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-medium">Official Data Imports</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Server-side NYS DEC GIS import, clipped to the official Adirondack Park
        blueline. Re-running updates official fields only.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.dataset}
            className="rounded-2xl border border-white/10 bg-[var(--bg3)]/40 p-5"
          >
            <h3 className="font-medium">{card.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Current records: {card.count}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Last imported: {card.lastImported ? card.lastImported.slice(0, 16).replace("T", " ") : "Never"}
            </p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run(card.dataset, card.title)}
              className="mt-4 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-2 text-xs tracking-[0.16em] text-[var(--accent-light)] disabled:opacity-50"
            >
              {busy === card.dataset ? "IMPORTING…" : "RUN IMPORT"}
            </button>
          </article>
        ))}
      </div>
      {message && (
        <p className="mt-4 text-sm text-[var(--text)]">{message}</p>
      )}
      <h3 className="mt-8 text-sm tracking-[0.16em] text-[var(--text-muted)]">
        RECENT IMPORT LOGS
      </h3>
      <ul className="mt-3 space-y-2">
        {logs.length === 0 && (
          <li className="text-sm text-[var(--text-muted)]">No imports yet.</li>
        )}
        {logs.map((log) => (
          <li key={log.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
            <span className="uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {log.status}
            </span>{" "}
            · {log.metadata_json?.dataset ?? "dec"} · {log.started_at.slice(0, 16).replace("T", " ")}
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              recv {log.records_received} · created {log.records_created} · updated{" "}
              {log.records_updated} · skipped {log.records_skipped} · failed{" "}
              {log.records_failed}
            </p>
            {log.error_message && (
              <p className="mt-1 text-xs text-red-300">{log.error_message}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
