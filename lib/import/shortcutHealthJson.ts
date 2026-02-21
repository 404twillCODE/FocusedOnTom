/**
 * Validate and normalize JSON exported from an iOS Shortcut for health metrics.
 * Format: { type, unit?, entries: [{ recordedAt, value }] }
 */

export type ShortcutHealthType = "weight" | "steps" | "active_energy";

export type ShortcutHealthEntry = {
  recordedAt: string;
  value: number;
};

export type ShortcutHealthJson = {
  type: ShortcutHealthType;
  unit?: string | null;
  entries: ShortcutHealthEntry[];
};

const VALID_TYPES: ShortcutHealthType[] = ["weight", "steps", "active_energy"];

function isShortcutHealthType(s: unknown): s is ShortcutHealthType {
  return typeof s === "string" && VALID_TYPES.includes(s as ShortcutHealthType);
}

function parseRecordedAt(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseValue(raw: unknown): number | null {
  if (typeof raw === "number" && !isNaN(raw)) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/,/g, ""));
    return isNaN(n) ? null : n;
  }
  return null;
}

export type ValidationResult =
  | { ok: true; data: ShortcutHealthJson; normalized: { type: ShortcutHealthType; value: number; unit: string | null; recorded_at: string }[] }
  | { ok: false; error: string };

/**
 * Parse and validate pasted JSON. Returns normalized metrics ready for health_metrics upsert.
 */
export function validateShortcutHealthJson(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Root must be an object." };
  }

  const obj = parsed as Record<string, unknown>;
  const type = obj.type;
  if (!isShortcutHealthType(type)) {
    return {
      ok: false,
      error: `"type" must be one of: ${VALID_TYPES.join(", ")}.`,
    };
  }

  const entriesRaw = obj.entries;
  if (!Array.isArray(entriesRaw)) {
    return { ok: false, error: '"entries" must be an array.' };
  }

  const unit =
    obj.unit === undefined || obj.unit === null
      ? null
      : String(obj.unit).trim() || null;

  const normalized: { type: ShortcutHealthType; value: number; unit: string | null; recorded_at: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < entriesRaw.length; i++) {
    const entry = entriesRaw[i];
    if (entry === null || typeof entry !== "object") {
      return { ok: false, error: `entries[${i}]: each entry must be an object.` };
    }
    const e = entry as Record<string, unknown>;
    const recordedAt = parseRecordedAt(e.recordedAt);
    if (!recordedAt) {
      return {
        ok: false,
        error: `entries[${i}]: "recordedAt" must be a valid date string.`,
      };
    }
    const value = parseValue(e.value);
    if (value === null) {
      return {
        ok: false,
        error: `entries[${i}]: "value" must be a number.`,
      };
    }
    const dedupeKey = `${type}|${recordedAt}|${value}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push({
      type,
      value,
      unit,
      recorded_at: recordedAt,
    });
  }

  const data: ShortcutHealthJson = {
    type,
    unit: unit ?? undefined,
    entries: normalized.map((n) => ({ recordedAt: n.recorded_at, value: n.value })),
  };

  return { ok: true, data, normalized };
}
