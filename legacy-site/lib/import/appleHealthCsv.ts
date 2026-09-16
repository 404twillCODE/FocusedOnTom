/**
 * Parse Apple Health export CSV (or similar) and normalize into health metrics and workouts.
 * Supports common column naming from various export tools.
 */

export type RawRow = Record<string, string>;

export type HealthMetricType = "weight" | "steps" | "active_energy";
export type NormalizedMetric = {
  type: HealthMetricType;
  value: number;
  unit: string | null;
  recorded_at: string; // ISO
};
export type NormalizedWorkout = {
  activity: string | null;
  duration_minutes: number | null;
  calories: number | null;
  recorded_at: string; // ISO
};

const DATE_ALIASES = [
  "date",
  "start date",
  "start",
  "creation date",
  "timestamp",
  "time",
  "recorded at",
];
const VALUE_ALIASES = [
  "value",
  "count",
  "amount",
  "quantity",
  "weight (kg)",
  "weight (lb)",
  "steps",
  "active energy",
  "energy burned",
];
const UNIT_ALIASES = ["unit", "units"];
const ACTIVITY_ALIASES = ["activity", "activity type", "workout", "type"];
const DURATION_ALIASES = ["duration", "duration (min)", "duration (minutes)"];
const CALORIES_ALIASES = ["energy burned", "calories", "active energy", "kcal"];

function findColumn(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const a of aliases) {
    const i = lower.indexOf(a.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

/** Parse CSV file into array of row objects (first row = headers). */
export function parseCSV(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = (reader.result as string).trim();
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        const headers = parseCSVLine(lines[0]);
        const rows: RawRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: RawRow = {};
          headers.forEach((h, j) => {
            row[h] = values[j] ?? "";
          });
          rows.push(row);
        }
        resolve(rows);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\t") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export type DetectedType = "weight" | "steps" | "energy" | "workouts" | "unknown";

/** Infer data type from headers and first row. */
export function detectType(rows: RawRow[]): DetectedType {
  if (rows.length === 0) return "unknown";
  const headers = Object.keys(rows[0]).map((h) => h.trim().toLowerCase());
  const first = rows[0];
  const firstStr = JSON.stringify(first).toLowerCase();

  if (
    headers.some((h) => h.includes("workout") || h.includes("activity")) ||
    firstStr.includes("running") ||
    firstStr.includes("cycling") ||
    firstStr.includes("yoga")
  ) {
    return "workouts";
  }
  if (
    headers.some((h) => h.includes("weight") || h === "body mass") ||
    firstStr.includes("kg") ||
    firstStr.includes("lb")
  ) {
    return "weight";
  }
  if (
    headers.some((h) => h.includes("step")) ||
    firstStr.includes("count") ||
    (firstStr.match(/\d+/) && headers.some((h) => h.includes("value") || h === "count"))
  ) {
    const sample = firstStr + JSON.stringify(headers);
    if (sample.includes("energy") || sample.includes("calorie") || sample.includes("kcal"))
      return "energy";
    return "steps";
  }
  if (
    headers.some((h) => h.includes("energy") || h.includes("calorie") || h.includes("active"))
  ) {
    return "energy";
  }
  return "unknown";
}

/** Normalize rows into metrics or workouts. Optionally pass column indices. */
export function normalize(
  rows: RawRow[],
  detected: DetectedType,
  mapping?: {
    dateIndex?: number;
    valueIndex?: number;
    unitIndex?: number;
    activityIndex?: number;
    durationIndex?: number;
    caloriesIndex?: number;
  }
): { metrics: NormalizedMetric[]; workouts: NormalizedWorkout[] } {
  const metrics: NormalizedMetric[] = [];
  const workouts: NormalizedWorkout[] = [];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  const dateCol =
    mapping?.dateIndex ?? findColumn(headers, DATE_ALIASES);
  const valueCol =
    mapping?.valueIndex ?? findColumn(headers, VALUE_ALIASES);
  const unitCol =
    mapping?.unitIndex ?? findColumn(headers, UNIT_ALIASES);
  const activityCol =
    mapping?.activityIndex ?? findColumn(headers, ACTIVITY_ALIASES);
  const durationCol =
    mapping?.durationIndex ?? findColumn(headers, DURATION_ALIASES);
  const caloriesCol =
    mapping?.caloriesIndex ?? findColumn(headers, CALORIES_ALIASES);

  const getVal = (row: RawRow, index: number): string =>
    index >= 0 && index < headers.length ? (row[headers[index]] ?? "").trim() : "";

  const parseDate = (raw: string): string | null => {
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  const parseNum = (raw: string): number | null => {
    const n = parseFloat(raw.replace(/,/g, ""));
    return isNaN(n) ? null : n;
  };

  if (detected === "workouts") {
    for (const row of rows) {
      const dateStr = getVal(row, dateCol);
      const recorded = parseDate(dateStr);
      if (!recorded) continue;
      const activity = activityCol >= 0 ? getVal(row, activityCol) || null : null;
      const dur = durationCol >= 0 ? parseNum(getVal(row, durationCol)) : null;
      const cal = caloriesCol >= 0 ? parseNum(getVal(row, caloriesCol)) : null;
      workouts.push({
        activity: activity || null,
        duration_minutes: dur,
        calories: cal,
        recorded_at: recorded,
      });
    }
    return { metrics, workouts };
  }

  const type: HealthMetricType =
    detected === "weight" ? "weight" : detected === "steps" ? "steps" : "active_energy";

  const seen = new Set<string>();
  for (const row of rows) {
    const dateStr = getVal(row, dateCol);
    const recorded = parseDate(dateStr);
    if (!recorded) continue;
    const valueRaw = valueCol >= 0 ? getVal(row, valueCol) : "";
    const value = parseNum(valueRaw);
    if (value === null) continue;
    const unit = unitCol >= 0 ? getVal(row, unitCol) || null : null;
    const dedupeKey = `${type}|${recorded}|${value}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    metrics.push({ type, value, unit, recorded_at: recorded });
  }

  return { metrics, workouts };
}
