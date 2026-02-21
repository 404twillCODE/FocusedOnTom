"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import {
  batchUpsertHealthMetrics,
  batchUpsertHealthWorkouts,
} from "@/lib/supabase/health";
import {
  parseCSV,
  detectType,
  normalize,
  type RawRow,
  type DetectedType,
} from "@/lib/import/appleHealthCsv";
import { FOYContainer, FOYCard, FOYBackLink, FOYButton } from "@/app/focusedonyou/_components";
import { Upload, FileSpreadsheet, FileJson } from "lucide-react";

const PREVIEW_ROWS = 20;

export default function AppleHealthImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [detected, setDetected] = useState<DetectedType>("unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ metrics: number; workouts: number } | null>(null);
  const [mapping, setMapping] = useState<{
    dateIndex?: number;
    valueIndex?: number;
    unitIndex?: number;
    activityIndex?: number;
    durationIndex?: number;
    caloriesIndex?: number;
  }>({});

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    try {
      const parsed = await parseCSV(f);
      setRows(parsed);
      setDetected(detectType(parsed));
      setMapping({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
      setRows([]);
      setDetected("unknown");
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (rows.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const supabase = getFOYSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in to import.");
        return;
      }
      const { metrics, workouts } = normalize(rows, detected, mapping);
      const ts = new Date().toISOString();
      if (metrics.length > 0) {
        await batchUpsertHealthMetrics(
          supabase,
          metrics.map((m) => ({
            user_id: user.id,
            type: m.type,
            value: m.value,
            unit: m.unit,
            recorded_at: m.recorded_at,
            updated_at: ts,
          }))
        );
      }
      if (workouts.length > 0) {
        await batchUpsertHealthWorkouts(
          supabase,
          workouts.map((w) => ({
            user_id: user.id,
            activity: w.activity,
            duration_minutes: w.duration_minutes,
            calories: w.calories,
            recorded_at: w.recorded_at,
            updated_at: ts,
          }))
        );
      }
      setResult({ metrics: metrics.length, workouts: workouts.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }, [rows, detected, mapping]);

  const previewRows = rows.slice(0, PREVIEW_ROWS);

  return (
    <FOYContainer className="py-8">
      <div className="mb-6">
        <FOYBackLink
          href="/focusedonyou/settings"
          ariaLabel="Back to Settings"
        >
          Back
        </FOYBackLink>
      </div>

      <FOYCard className="flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
            <FileSpreadsheet className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">
              Import Apple Health (CSV)
            </h1>
            <p className="mt-1 text-sm text-[var(--textMuted)]">
              Export your data from Apple Health (or a compatible app) as CSV, then upload it here.
              We support body weight, step counts, active energy, and workout summaries.
            </p>
            <Link
              href="/focusedonyou/settings/import/apple-health/shortcut"
              className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--ice)] hover:underline"
            >
              <FileJson className="h-4 w-4" aria-hidden />
              Or import from iOS Shortcut (JSON)
            </Link>
          </div>
        </div>

        <div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg3)]/30 p-6 transition-colors hover:border-[var(--ice)]/40 hover:bg-[var(--iceSoft)]/20">
            <Upload className="h-8 w-8 text-[var(--textMuted)]" aria-hidden />
            <span className="text-sm font-medium text-[var(--text)]">
              {file ? file.name : "Choose a CSV file"}
            </span>
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={handleFile}
              aria-label="Select CSV file"
            />
          </label>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        {result && (
          <div
            className="rounded-xl border border-[var(--ice)]/30 bg-[var(--iceSoft)]/30 px-4 py-3 text-sm text-[var(--ice)]"
            role="status"
          >
            Imported {result.metrics} metric entries and {result.workouts} workouts.
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text)]">
                Detected: {detected}
              </p>
              <p className="text-xs text-[var(--textMuted)]">
                First {PREVIEW_ROWS} rows (of {rows.length}):
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg3)]/50">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap px-3 py-2 font-medium text-[var(--textMuted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-[var(--border)]/70 last:border-0"
                    >
                      {headers.map((key, i) => (
                        <td
                          key={i}
                          className="max-w-[200px] truncate px-3 py-2 text-[var(--text)]"
                          title={String(row[key] ?? "")}
                        >
                          {String(row[key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FieldMapping
              headers={headers}
              detected={detected}
              mapping={mapping}
              onChange={setMapping}
            />

            <FOYButton
              variant="primary"
              disabled={loading}
              onClick={handleImport}
              className="self-start"
            >
              {loading ? "Importing…" : "Import"}
            </FOYButton>
          </>
        )}
      </FOYCard>
    </FOYContainer>
  );
}

function FieldMapping({
  headers,
  detected,
  mapping,
  onChange,
}: {
  headers: string[];
  detected: DetectedType;
  mapping: {
    dateIndex?: number;
    valueIndex?: number;
    unitIndex?: number;
    activityIndex?: number;
    durationIndex?: number;
    caloriesIndex?: number;
  };
  onChange: (m: typeof mapping) => void;
}) {
  const options = headers.map((h, i) => ({ label: h, value: i }));
  const empty = { label: "— Auto —", value: -1 };

  const update = (key: keyof typeof mapping, value: number) => {
    if (value === -1) {
      const next = { ...mapping };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...mapping, [key]: value });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/20 p-4">
      <p className="text-sm font-medium text-[var(--text)]">
        Column mapping (optional)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--textMuted)]">Date</span>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)]"
            value={mapping.dateIndex ?? -1}
            onChange={(e) => update("dateIndex", Number(e.target.value))}
          >
            <option value={-1}>{empty.label}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {(detected === "weight" || detected === "steps" || detected === "energy") && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--textMuted)]">Value</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)]"
                value={mapping.valueIndex ?? -1}
                onChange={(e) => update("valueIndex", Number(e.target.value))}
              >
                <option value={-1}>{empty.label}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--textMuted)]">Unit</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)]"
                value={mapping.unitIndex ?? -1}
                onChange={(e) => update("unitIndex", Number(e.target.value))}
              >
                <option value={-1}>{empty.label}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {detected === "workouts" && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--textMuted)]">Activity</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)]"
                value={mapping.activityIndex ?? -1}
                onChange={(e) => update("activityIndex", Number(e.target.value))}
              >
                <option value={-1}>{empty.label}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--textMuted)]">Duration (min)</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)]"
                value={mapping.durationIndex ?? -1}
                onChange={(e) => update("durationIndex", Number(e.target.value))}
              >
                <option value={-1}>{empty.label}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--textMuted)]">Calories</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)]"
                value={mapping.caloriesIndex ?? -1}
                onChange={(e) => update("caloriesIndex", Number(e.target.value))}
              >
                <option value={-1}>{empty.label}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
