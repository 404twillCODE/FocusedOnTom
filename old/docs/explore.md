# Explore New York — setup

This project uses the existing Supabase project (same URL/keys already in `.env.local`). Explore tables are new and sit beside photography/workout tables. They do not replace them.

Adirondack filtering uses the official NYS APA Blueline polygon, with point-in-polygon in TypeScript (`@turf/boolean-point-in-polygon`). PostGIS is not required.

## 1. Supabase project

Use the current Focused on Tom project (`NEXT_PUBLIC_SUPABASE_URL`). Create a new project only if you are starting from scratch.

## 2. Environment variables

Already listed in `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional, only if you want `npm run explore:apply-schema` instead of the SQL editor:

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:6543/postgres
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable.

## 3. Run the migration

Open the Supabase SQL editor and paste:

`supabase/migrations/20260821120000_explore_ny.sql`

Or, with a database URL:

```bash
npm run explore:apply-schema
```

## 4. Seed Phase 1 sample data

```bash
npm run explore:seed
```

Safe to re-run. Uses upsert on stable IDs (`place-delta-lake`, etc.).

## 5. Create the owner auth user

In Supabase Dashboard → Authentication → Users → Add user (email/password). Do not enable public signup.

## 6. Mark that user as Explore admin

```bash
npx tsx scripts/explore-promote-admin.ts you@example.com
```

This writes `explore_admins`. Owner access is the user id in that table, not “whoever knows the email.”

## 7. Run DEC imports

Sign in at `/explore/admin/login`, then **Official Data Imports**:

- NYS DEC — Primitive Campsites
- NYS DEC — Lean-tos

Imports fetch [DEC Backcountry Features](https://gisservices.dec.ny.gov/arcgis/rest/services/dec_backcountry_features/MapServer/0), keep only points inside the [APA Blueline](https://services2.arcgis.com/8krRUWgifzA4cgL3/ArcGIS/rest/services/BluelinePolygon/FeatureServer/0), and upsert on `(source_id, source_record_id)`. Personal status, visits, photos, goals, and field reports are never overwritten.

## 8. Start the app

```bash
npm run dev
```

Public atlas: `/explore`  
Owner tools: `/explore/admin` (not in the main nav)
