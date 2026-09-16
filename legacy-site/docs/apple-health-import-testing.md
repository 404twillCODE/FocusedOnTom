# Apple Health CSV import – how to test

## Quick test with sample files

1. **Run the app** and sign in to FocusedOnYou.
2. Go to **Settings** → **Import Apple Health (CSV)** (or open `/focusedonyou/settings/import/apple-health`).
3. Use the sample CSVs in `public/samples/`:
   - `apple-health-weight.csv` – body weight (detected as **weight**)
   - `apple-health-steps.csv` – step count (detected as **steps**)
   - `apple-health-active-energy.csv` – active energy (detected as **energy**)
   - `apple-health-workouts.csv` – workout summary (detected as **workouts**)
4. **Upload**: click “Choose a CSV file” and pick one of the samples (or drag & drop if your browser supports it).
5. Check the **preview table** (first 20 rows) and **Detected** type.
6. Optionally adjust **Column mapping** if the auto-detection picked the wrong columns.
7. Click **Import**. You should see: “Imported X metric entries and Y workouts.”
8. **Verify in Supabase**:
   - Table `health_metrics`: rows with your `user_id`, `type` in (`weight`|`steps`|`active_energy`), `value`, `recorded_at`, `source = 'apple_health_import'`.
   - Table `health_workouts`: rows with `user_id`, `activity`, `duration_minutes`, `calories`, `recorded_at`, `source = 'apple_health_import'`.

## De-duplication and “newest wins”

- **Metrics**: same `(user_id, type, recorded_at)` → one row; re-importing updates `value`/`unit` and `updated_at`.
- **Workouts**: same `(user_id, recorded_at)` → one row; re-importing updates activity/duration/calories and `updated_at`.

Re-upload the same CSV and run Import again; row counts in the DB should not double, and the latest import’s values should be stored.

## Testing without running the app

- **Parser only**: in Node or browser, `import { parseCSV, detectType, normalize } from '@/lib/import/appleHealthCsv'`. Use `File` from a file input or create a mock `File` with the sample CSV text and run `parseCSV(file)` → `detectType(rows)` → `normalize(rows, detected)` and assert on `metrics`/`workouts`.

## Sample file formats

The samples use typical Apple Health export-style headers:

- **Weight**: `Start Date`, `Weight (kg)`, `Unit`
- **Steps**: `Date`, `Step Count`, `Unit`
- **Workouts**: `Start Date`, `Activity Type`, `Duration (min)`, `Active Energy (kcal)`

If your export uses different column names, use the mapping dropdowns on the import page to map **Date**, **Value**, **Unit** (for metrics) or **Activity**, **Duration**, **Calories** (for workouts).
