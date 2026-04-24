# FocusedOnTom

Personal site — Next.js 16, Tailwind, Framer Motion. Code, photography, and
side-projects.

## Dev

```bash
npm install
npm run dev
```

`npm run dev` starts **Next.js and the photography sync at the same time**
(`scripts/dev.mjs`). The dev server comes up right away; the sync keeps
running in the same terminal (compress + upload changed WebPs to R2 +
rewrite `lib/photography-manifest.json`). It uses the per-file cache so
reruns are fast, and it **never uploads originals** unless you opt in. If R2
env vars are missing, the sync soft-fails and Next still runs.

When the sync finishes, **hard-refresh** if new photos don’t appear yet (the
app may have cached the old manifest).

- **`npm run dev:fast`** — Next only, no background sync.
- **`npm run dev:sync-first`** — wait for the full sync, then start Next
  (old sequential behavior).

During sync, the script logs a **heartbeat every 10 images** (upload vs cache
counts + current path). Use `--no-progress` or `PHOTOS_SYNC_PROGRESS=0` to
silence; `--verbose` on `photos:dev` / `photos:sync` for per-file lines.

Environment variables live in `.env.local`. See [`.env.example`](./.env.example)
for the full list.

---

## Photography workflow

Original photos are stored **locally** under `./photography/` (git-ignored)
and the site loads optimized versions from **Cloudflare R2**. GitHub only ever
sees the code and the generated manifest.

```bash
# drop full-quality JPGs into the right folder
photography/cars/<event-slug>/<optional-subfolder>/*.jpg

# compress + upload + regenerate the manifest
npm run photos:sync

# commit the generated manifest so the site sees them in production
git add lib/photography-manifest.json
git commit -m "photos: add <event-slug>"
```

What the sync script does:

- scans `./photography/` recursively (falls back to `./public/photography/`)
- extracts EXIF from each original (camera, lens, ISO, shutter, aperture, focal)
- compresses to WebP (long-edge 3000px, quality 82) — **in memory**, never on disk
- uploads the optimized WebPs to R2 under `photography/<same relative path>`
- (opt-in via `ORIGINALS_UPLOAD=true`) uploads the full-size originals too
- writes `lib/photography-manifest.json` with URLs, dimensions, EXIF, and folder metadata

Useful scripts:

| command                      | what it does                                                              |
| ---------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`                | Next + photo sync **in parallel** (see `scripts/dev.mjs`)                 |
| `npm run dev:sync-first`     | full sync, **then** `next dev` (sequential)                               |
| `npm run dev:fast`           | just `next dev`, no photo sync                                            |
| `npm run photos:dev`         | photo sync only (same script `dev` runs in the background)               |
| `npm run photos:sync`        | compress + upload changed photos + rewrite manifest (strict env checks)   |
| `npm run photos:sync:dry`    | scan + compress, no uploads, no manifest writes                           |
| `npm run photos:sync:force`  | ignore local cache and re-upload everything                               |

Required env (in `.env.local`):

```
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=focusedontom-photos
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.focusedontom.com
NEXT_PUBLIC_CDN_URL=https://cdn.focusedontom.com
```

If **`getaddrinfo ENOTFOUND`** or **`/_next/image` returns 500** in dev, the
hostname in those two URLs is not resolving yet. Use Cloudflare’s public
**`*.r2.dev`** bucket URL in both vars until your custom domain’s DNS is live,
then run **`npm run photos:sync`** once more. Full guide and troubleshooting:
[`docs/ADDING_PHOTOS.md`](./docs/ADDING_PHOTOS.md).

---

## Build / deploy

```bash
npm run build
npm start
```

Deployed on Vercel. Cloudflare R2 hosts the photography assets — they never
pass through the Vercel build.
