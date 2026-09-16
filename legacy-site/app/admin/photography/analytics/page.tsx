"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminGate } from "@/components/admin/AdminGate";

type AnalyticsPayload = {
  ok: true;
  total: number;
  days: number;
  byName: Record<string, number>;
  byDay: Record<string, number>;
  byNameByDay: Record<string, Record<string, number>>;
};

function BarChartByDay({
  byDay,
  days,
}: {
  byDay: Record<string, number>;
  days: number;
}) {
  const keys = useMemo(() => {
    const src = Object.keys(byDay);
    // Fill in any days without events so the chart is continuous. We key the
    // memo on byDay, not Date.now, so this stays deterministic per render.
    if (src.length === 0) return [];
    src.sort();
    const start = new Date(src[0] + "T00:00:00Z");
    const end = new Date(src[src.length - 1] + "T00:00:00Z");
    const out: string[] = [];
    for (
      let t = start.getTime();
      t <= end.getTime();
      t += 86400_000
    ) {
      out.push(new Date(t).toISOString().slice(0, 10));
    }
    // Pad left up to `days` so the chart width matches the selected range.
    while (out.length < days) {
      const prev = new Date(out[0] + "T00:00:00Z");
      prev.setUTCDate(prev.getUTCDate() - 1);
      out.unshift(prev.toISOString().slice(0, 10));
    }
    return out;
  }, [byDay, days]);
  const max = Math.max(1, ...keys.map((k) => byDay[k] ?? 0));
  const W = 720;
  const H = 180;
  const pad = 24;
  const barW = (W - pad * 2) / keys.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-48 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Events per day"
    >
      {keys.map((k, i) => {
        const v = byDay[k] ?? 0;
        const h = ((H - pad * 2) * v) / max;
        const x = pad + i * barW + 2;
        const y = H - pad - h;
        return (
          <g key={k}>
            <rect
              x={x}
              y={y}
              width={Math.max(1, barW - 4)}
              height={h}
              fill="var(--ice)"
              opacity={0.85}
              rx={2}
            >
              <title>
                {k}: {v}
              </title>
            </rect>
          </g>
        );
      })}
      <line
        x1={pad}
        y1={H - pad}
        x2={W - pad}
        y2={H - pad}
        stroke="var(--border)"
      />
    </svg>
  );
}

function AnalyticsDash() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback(
    async (d: number) => {
      setError(null);
      try {
        const password = sessionStorage.getItem("admin_password") ?? "";
        const res = await fetch(
          `/api/admin/photography/analytics?days=${d}`,
          {
            headers: { "x-admin-password": password },
          }
        );
        const payload = (await res.json()) as
          | AnalyticsPayload
          | { ok: false; error?: string };
        if (!res.ok || !payload.ok) {
          throw new Error(
            ("error" in payload && payload.error) || "Failed to load"
          );
        }
        setData(payload);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    []
  );

  useEffect(() => {
    load(days);
  }, [load, days]);

  const sortedNames = useMemo(() => {
    if (!data) return [] as { name: string; count: number }[];
    return Object.entries(data.byName)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-24 pb-16">
      <Link
        href="/admin/photography"
        className="inline-flex items-center gap-2 text-sm text-[var(--textMuted)] hover:text-[var(--ice)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to admin
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
            Photography analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--textMuted)]">
            Last {data?.days ?? days} days · {data?.total ?? 0} events
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full border px-3 py-1.5 transition-colors ${
                days === d
                  ? "border-[var(--ice)]/60 bg-[var(--ice)]/15 text-[var(--ice)]"
                  : "border-[var(--border)] bg-[var(--bg3)]/60 text-[var(--textMuted)] hover:text-[var(--text)]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {!data && !error && (
        <div className="mt-10 flex items-center gap-2 text-sm text-[var(--textMuted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {data && (
        <>
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
              Events per day
            </h2>
            <div className="mt-3">
              <BarChartByDay byDay={data.byDay} days={data.days} />
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 p-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--textMuted)]">
              By event name
            </h2>
            <div className="mt-4 space-y-2">
              {sortedNames.length === 0 && (
                <p className="text-sm text-[var(--textMuted)]">
                  No events yet.
                </p>
              )}
              {sortedNames.map(({ name, count }) => {
                const max = sortedNames[0]?.count ?? 1;
                const pct = (count / max) * 100;
                return (
                  <div key={name}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium text-[var(--text)]">
                        {name}
                      </span>
                      <span className="text-[var(--textMuted)]">{count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg3)]/60">
                      <div
                        className="h-full bg-[var(--ice)]/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminGate>
      <AnalyticsDash />
    </AdminGate>
  );
}
