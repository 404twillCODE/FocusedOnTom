"use client";

import { useCallback, useState } from "react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { batchUpsertHealthMetrics } from "@/lib/supabase/health";
import { validateShortcutHealthJson } from "@/lib/import/shortcutHealthJson";
import {
  FOYContainer,
  FOYCard,
  FOYBackLink,
  FOYButton,
} from "@/app/focusedonyou/_components";
import { FileJson } from "lucide-react";

const PREVIEW_ROWS = 20;

const EXAMPLE_WEIGHT = `{
  "type": "weight",
  "unit": "kg",
  "entries": [
    { "recordedAt": "2024-01-15T08:00:00Z", "value": 72.5 },
    { "recordedAt": "2024-01-16T08:00:00Z", "value": 72.3 }
  ]
}`;

const EXAMPLE_STEPS = `{
  "type": "steps",
  "unit": "count",
  "entries": [
    { "recordedAt": "2024-01-15T00:00:00Z", "value": 8520 },
    { "recordedAt": "2024-01-16T00:00:00Z", "value": 10234 }
  ]
}`;

const EXAMPLE_ENERGY = `{
  "type": "active_energy",
  "unit": "kcal",
  "entries": [
    { "recordedAt": "2024-01-15T00:00:00Z", "value": 1850 }
  ]
}`;

export default function ShortcutImportPage() {
  const [paste, setPaste] = useState("");
  const [validation, setValidation] = useState<
    ReturnType<typeof validateShortcutHealthJson> | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const runValidation = useCallback(() => {
    const trimmed = paste.trim();
    if (!trimmed) {
      setValidation(null);
      return;
    }
    setValidation(validateShortcutHealthJson(trimmed));
    setError(null);
    setImportedCount(null);
  }, [paste]);

  const handleImport = useCallback(async () => {
    const trimmed = paste.trim();
    if (!trimmed) return;
    const result = validateShortcutHealthJson(trimmed);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.normalized.length === 0) {
      setError("No valid entries to import.");
      return;
    }
    setLoading(true);
    setError(null);
    setImportedCount(null);
    try {
      const supabase = getFOYSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in to import.");
        return;
      }
      const ts = new Date().toISOString();
      await batchUpsertHealthMetrics(
        supabase,
        result.normalized.map((m) => ({
          user_id: user.id,
          type: m.type,
          value: m.value,
          unit: m.unit,
          recorded_at: m.recorded_at,
          source: "apple_health_shortcut",
          updated_at: ts,
        }))
      );
      setImportedCount(result.normalized.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }, [paste]);

  const valid = validation?.ok === true;
  const previewEntries = valid ? validation.normalized.slice(0, PREVIEW_ROWS) : [];

  return (
    <FOYContainer className="py-8">
      <div className="mb-6">
        <FOYBackLink
          href="/focusedonyou/settings/import/apple-health"
          ariaLabel="Back to Apple Health import"
        >
          Back
        </FOYBackLink>
      </div>

      <FOYCard className="flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
            <FileJson className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">
              Import from iOS Shortcut (JSON)
            </h1>
            <p className="mt-1 text-sm text-[var(--textMuted)]">
              Paste JSON exported from your Shortcut. It must include{" "}
              <code className="rounded bg-[var(--bg3)] px-1 py-0.5 text-xs">type</code>
              , optional{" "}
              <code className="rounded bg-[var(--bg3)] px-1 py-0.5 text-xs">unit</code>
              , and{" "}
              <code className="rounded bg-[var(--bg3)] px-1 py-0.5 text-xs">entries</code>{" "}
              (array of <code className="rounded bg-[var(--bg3)] px-1 py-0.5 text-xs">recordedAt</code> and{" "}
              <code className="rounded bg-[var(--bg3)] px-1 py-0.5 text-xs">value</code>).
              Stored the same as CSV imports in health metrics.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">Format</p>
          <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg3)]/50 p-4 text-xs text-[var(--textMuted)]">
            {`{ "type": "weight"|"steps"|"active_energy", "unit": "...", "entries": [{ "recordedAt": "...", "value": 123 }] }`}
          </pre>
        </div>

        <details className="group rounded-xl border border-[var(--border)] bg-[var(--bg3)]/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              Example JSON (weight, steps, active_energy)
            </span>
          </summary>
          <div className="border-t border-[var(--border)] px-4 pb-4 pt-2">
            <p className="mb-1 text-xs text-[var(--textMuted)]">Weight</p>
            <pre className="mb-4 overflow-x-auto rounded-lg bg-[var(--bg2)] p-3 text-xs text-[var(--text)]">
              {EXAMPLE_WEIGHT}
            </pre>
            <p className="mb-1 text-xs text-[var(--textMuted)]">Steps</p>
            <pre className="mb-4 overflow-x-auto rounded-lg bg-[var(--bg2)] p-3 text-xs text-[var(--text)]">
              {EXAMPLE_STEPS}
            </pre>
            <p className="mb-1 text-xs text-[var(--textMuted)]">Active energy</p>
            <pre className="overflow-x-auto rounded-lg bg-[var(--bg2)] p-3 text-xs text-[var(--text)]">
              {EXAMPLE_ENERGY}
            </pre>
          </div>
        </details>

        <div>
          <label htmlFor="shortcut-json" className="mb-2 block text-sm font-medium text-[var(--text)]">
            Paste JSON
          </label>
          <textarea
            id="shortcut-json"
            rows={8}
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg2)] px-4 py-3 font-mono text-sm text-[var(--text)] placeholder:text-[var(--textMuted)] focus:border-[var(--ice)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/20"
            placeholder='{ "type": "weight", "unit": "kg", "entries": [...] }'
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            aria-invalid={validation && !validation.ok ? true : undefined}
            aria-describedby={validation && !validation.ok ? "shortcut-json-error" : undefined}
          />
          <FOYButton
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={runValidation}
          >
            Validate & preview
          </FOYButton>
        </div>

        {validation && !validation.ok && (
          <div
            id="shortcut-json-error"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            role="alert"
          >
            {validation.error}
          </div>
        )}

        {error && (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        {importedCount !== null && (
          <div
            className="rounded-xl border border-[var(--ice)]/30 bg-[var(--iceSoft)]/30 px-4 py-3 text-sm text-[var(--ice)]"
            role="status"
          >
            Imported {importedCount} metric {importedCount === 1 ? "entry" : "entries"}.
          </div>
        )}

        {valid && (
          <>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                Preview ({validation.normalized.length} total, showing first {Math.min(PREVIEW_ROWS, validation.normalized.length)})
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg3)]/50">
                    <th className="px-3 py-2 font-medium text-[var(--textMuted)]">recorded_at</th>
                    <th className="px-3 py-2 font-medium text-[var(--textMuted)]">value</th>
                    <th className="px-3 py-2 font-medium text-[var(--textMuted)]">unit</th>
                    <th className="px-3 py-2 font-medium text-[var(--textMuted)]">type</th>
                  </tr>
                </thead>
                <tbody>
                  {previewEntries.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)]/70 last:border-0"
                    >
                      <td className="px-3 py-2 text-[var(--text)]">{row.recorded_at}</td>
                      <td className="px-3 py-2 text-[var(--text)]">{row.value}</td>
                      <td className="px-3 py-2 text-[var(--textMuted)]">{row.unit ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--text)]">{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
