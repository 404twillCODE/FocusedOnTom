# Adding photos

The photography section is **folder-based** and **R2-backed**:

1. You drop full-quality JPGs into a local folder tree (category/event/…).
2. You run **`npm run photos:sync`**.
3. The sync script:
   - extracts EXIF from each original
   - uploads the full original once to private R2
   - compresses every image to high-quality WebP (long-edge 2000px, quality ~82)
   - uploads the optimized WebP once to public R2
   - writes `lib/photography-manifest.json` and upserts `photos` when Supabase is configured
4. GitHub only stores code and the manifest; originals stay in private R2 and your local source folder.

---

## TL;DR

```bash
# One-time: create .env.local with your Cloudflare R2 keys
cp .env.example .env.local
$EDITOR .env.local

# Drop exported photos into the local folder tree (see below)
open ./photography

# Compress + upload + regenerate the manifest
npm run photos:sync
```

Then commit `lib/photography-manifest.json`. The site will now show the new photos.

---

## Folder structure

The source of truth is `./photography/` at the repo root. The folder is
**git-ignored** — it is only used as input for the sync script.

```
photography/
├── cars/
│   ├── Adam-LZ-WorldTour-Englishtown-NJ/
│   │   ├── car-meet/
│   │   │   ├── meta.json           (optional)
│   │   │   ├── PIC00123.jpg
│   │   │   └── PIC00124.jpg
│   │   ├── drifting/
│   │   │   ├── day-1/
│   │   │   │   └── *.jpg
│   │   │   └── day-2/
│   │   │       └── *.jpg
│   │   └── meta.json               (event-level; optional)
│   └── Chrysler-300/
│       └── *.jpg                   (no subfolders is fine)
├── landscape/
│   └── tampa-sunset-2026-03/
│       └── *.jpg
└── street/
```

Rules:

- **Level 1** = category (`cars`, `landscape`, `street`, …). Must match a
  category slug defined in `lib/photography.ts` → `categoryMeta`, otherwise
  the site still shows it but with an auto-generated title.
- **Level 2** = event (the gallery page). Folder name is the URL slug.
- **Level 3+** = optional subfolders (`drifting/day-1`). The site groups
  photos by subfolder and shows a "Folders" panel on the event page.
- Photos can also live directly in the event folder — in that case the event
  page renders a single flat masonry grid (no folder panel).

Supported file types: `.jpg`, `.jpeg`, `.png`, `.webp`. Hidden files and
`meta.json` are ignored.

> Migration note: if you have originals in the old `public/photography/`
> tree, the sync script still picks them up as a fallback. Move them into
> `./photography/` when convenient — `public/photography/` is no longer the
> recommended spot and anything there gets shipped inside your Next.js build.

---

## Optional `meta.json`

You can drop a `meta.json` inside any **event** folder (level 2) to override
defaults on the event's page:

```json
{
  "title": "Adam LZ World Tour — Englishtown, NJ",
  "date": "April 2026",
  "location": "Old Bridge Township Raceway Park",
  "summary": "Two days of drifting, a lot of tire smoke.",
  "cover": "https://cdn.focusedontom.com/photography/cars/.../hero.webp"
}
```

You can also drop a `meta.json` inside a **leaf folder** (level 3+) — its
`title` is used as the subfolder's title on the event page. Both are optional;
without them, names are derived from the folder slug.

| Field      | Missing → falls back to                                  |
| ---------- | -------------------------------------------------------- |
| `title`    | Title-cased folder slug                                  |
| `date`     | Earliest EXIF DateTimeOriginal → "Month Year", or `Recent` |
| `location` | Hidden                                                   |
| `summary`  | Hidden                                                   |
| `cover`    | First photo (alphabetical) of the event                  |

---

## Cloudflare R2 setup (one time)

1. Create two buckets in the R2 dashboard: `focusedontom-public` and
   `focusedontom-private`.
2. Keep `focusedontom-private` private. Only the public bucket needs a public
   custom domain or `*.r2.dev` URL.
3. Create an R2 API token with `Object Read/Write` for both buckets. Save the
   **access key ID** and **secret access key**.
4. Expose the public bucket over a public URL. The clean option is a custom domain
   (`cdn.focusedontom.com`); the quick option is the `*.r2.dev` subdomain.
5. Fill in `.env.local`:

   ```bash
   CLOUDFLARE_R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLOUDFLARE_R2_ACCESS_KEY_ID=xxxx
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxx
   CLOUDFLARE_R2_PUBLIC_BUCKET=focusedontom-public
   CLOUDFLARE_R2_PRIVATE_BUCKET=focusedontom-private
   CLOUDFLARE_R2_PUBLIC_URL=https://cdn.focusedontom.com
   NEXT_PUBLIC_CDN_URL=https://cdn.focusedontom.com
   ```

5. If you use a new CDN hostname that isn't `*.r2.dev` or
   `*.r2.cloudflarestorage.com`, set `NEXT_PUBLIC_CDN_URL` — the Next.js
   image optimizer reads the hostname from there.

---

## Running the sync

`npm run dev` starts **Next.js and the photography sync in parallel** (see
`scripts/dev.mjs`). You can open the site immediately; the sync keeps running
in the same terminal. When you see **`[dev] photos sync finished`**, do a **hard refresh** if new
shots don’t show yet.

The sync is the same as `npm run photos:dev`: incremental original upload,
public WebP upload, manifest rewrite, and cache skips for unchanged files.
Missing R2 env vars → soft-fail, existing manifest stays in use.

Manual runs:

```bash
# Normal run: skip photos that haven't changed since the last sync
npm run photos:sync

# Same as photos:sync, but soft-fails on missing env (what `dev` uses)
npm run photos:dev

# Preview without uploading or writing the manifest
npm run photos:sync:dry

# Ignore the local cache and re-upload every photo
npm run photos:sync:force

# Next.js only (no background photo sync)
npm run dev:fast

# Wait for the full photo sync to finish, then start Next.js (sequential)
npm run dev:sync-first

```

The script is incremental: it stores a small cache at
`scripts/.cache/photos-upload-cache.json` keyed by source-file mtime + size
so reruns only touch new or changed photos.

While it runs (unless you pass `--verbose` or `--no-progress`), it prints a
**heartbeat line every 10 photos** — `uploaded` vs `cache` counts and the
current file — so long `sharp` passes on big JPEGs do not look like a hang.
Override the interval with `PHOTOS_SYNC_PROGRESS_EVERY=25`, or silence with
`--no-progress` / `PHOTOS_SYNC_PROGRESS=0`.

**Builds don't sync.** `npm run build` intentionally does **not** trigger a
photo sync — production builds just read the committed
`lib/photography-manifest.json`. Always run a sync locally (or via
`npm run dev`) and commit the updated manifest before deploying.

---

## What ends up where

| Location                                     | Contents                                       | In git? |
| -------------------------------------------- | ---------------------------------------------- | ------- |
| `./photography/**`                           | original JPGs you drag in                      | no      |
| R2 public `public/<category>/<event>/**.webp` | optimized WebPs the site loads                 | n/a     |
| R2 private `originals/<category>/<event>/**`  | full-quality originals for paid downloads      | n/a     |
| `lib/photography-manifest.json`              | generated index (photo IDs, keys, EXIF, dimensions) | yes     |
| `scripts/.cache/photos-upload-cache.json`    | local upload cache (mtime/size signatures)     | no      |

---

## What the site renders

The site code is unchanged in shape — it just reads from the manifest now:

- `/photography` — category grid, with a photo count per category.
- `/photography/<category>` — event cards.
- `/photography/<category>/<event>` — masonry grid. If the event has
  subfolders, a "Folders" jump panel appears; otherwise it's a flat grid.
- Lightbox shows camera, lens, shutter, aperture, ISO, focal length when the
  EXIF is present.
- The homepage "Recent shots" strip picks the 3 newest photos (by EXIF date)
  across all categories.

---

## Troubleshooting

**`getaddrinfo ENOTFOUND cdn.…` or `TypeError: fetch failed` on `/_next/image`.**
The manifest points at `CLOUDFLARE_R2_PUBLIC_URL`, and **Next.js loads those
URLs from your dev machine** when optimizing images. If that hostname is not
in public DNS yet (or is wrong), Node cannot fetch them. Use a URL that
already resolves—most often the **R2 public bucket URL** (`https://pub-….r2.dev`)
from the Cloudflare dashboard—set it in **both** `CLOUDFLARE_R2_PUBLIC_URL` and
`NEXT_PUBLIC_CDN_URL`, then run **`npm run photos:sync`** again so every
`url` in `lib/photography-manifest.json` is regenerated. After your custom
CDN domain works, switch the two vars back and re-sync once more.

**`Missing required env var CLOUDFLARE_R2_*`.** Your `.env.local` is missing
one of the Cloudflare fields. Copy from `.env.example`.

**Photos don't show up after sync.** Make sure you committed the updated
`lib/photography-manifest.json` — that's what the site reads at build time.

**Image appears rotated.** The script bakes EXIF orientation into each
WebP before uploading, so rotation should Just Work. If you see a stuck
rotation, re-run with `--force` on that file (easiest: `touch` the source and
re-sync).

**`public/photography/` still has my old originals.** That path is still a
fallback source. Move them into `./photography/` when you can — the new path
is git-ignored, so you can safely keep 100GB of RAW-adjacent JPGs there
without touching GitHub.

---

## Quick reference

```bash
# add a brand-new car event
mkdir -p photography/cars/new-event-slug
cp ~/exports/*.jpg photography/cars/new-event-slug/
npm run photos:sync
git add lib/photography-manifest.json
git commit -m "photos: add new-event-slug"
```
