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
running in the same terminal (upload originals, compress + upload public WebPs,
and rewrite `lib/photography-manifest.json`). It uses the per-file cache so
reruns are fast. If R2 env vars are missing, the sync soft-fails and Next still
runs.

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
- uploads the full-quality original once to private R2 under `originals/...`
- compresses to WebP (long-edge 2000px, quality 82) — **in memory**, never on disk
- uploads the public WebP once to public R2 under `public/...`
- writes `lib/photography-manifest.json` with canonical photo IDs, R2 keys, URLs, dimensions, EXIF, price, and folder metadata

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
CLOUDFLARE_R2_PUBLIC_BUCKET=focusedontom-public
CLOUDFLARE_R2_PRIVATE_BUCKET=focusedontom-private
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.focusedontom.com
NEXT_PUBLIC_CDN_URL=https://cdn.focusedontom.com
```

If **`getaddrinfo ENOTFOUND`** or **`/_next/image` returns 500** in dev, the
hostname in those two URLs is not resolving yet. Use Cloudflare’s public
**`*.r2.dev`** bucket URL in both vars until your custom domain’s DNS is live,
then run **`npm run photos:sync`** once more. Full guide and troubleshooting:
[`docs/ADDING_PHOTOS.md`](./docs/ADDING_PHOTOS.md).

---

## Unified account, photos, and vault

The photography system uses one upload workflow and one canonical photo record.
`npm run photos:sync` reads local originals, uploads exactly one private original
and one public compressed image, then writes the manifest and upserts `photos`
when Supabase service-role env is configured.

`/vault` is also a private Drive-style file manager for arbitrary files. Those
manual vault uploads use the same private R2 bucket under a separate `vault/`
prefix and are not duplicated into the photography `photos` table.

Required env (in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_PUBLIC_BUCKET=focusedontom-photos
CLOUDFLARE_R2_PRIVATE_BUCKET=focusedontom-vault-private
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.focusedontom.com
NEXT_PUBLIC_CDN_URL=https://cdn.focusedontom.com
```

R2 setup:

- Create a public bucket for compressed gallery images and a private bucket for
  full-quality originals plus manual vault files.
- Keep `focusedontom-vault-private` private. Do not enable public `r2.dev`
  access and do not add a public custom domain.
- Create an R2 API token/key pair with read/write access to both buckets.
- Add the env vars above to Vercel and `.env.local`.

Supabase setup:

- Run [`photo_commerce_schema.sql`](./photo_commerce_schema.sql) in the Supabase SQL Editor.
- Run [`vault_drive_schema.sql`](./vault_drive_schema.sql) in the Supabase SQL Editor.
- Make sure email/password auth is enabled, since account login is shared across
  photography, FocusedOnYou, purchases, and vault.
- Owner/admin access uses [`app_admins.sql`](./app_admins.sql). Add your email
  to `app_admins` for site-wide max-tier/admin access.

Access rules:

- Public galleries use only compressed public images.
- `/vault` has My Vault, Photo Originals, Shared With Me, and Trash tabs.
- `/my-purchases` shows only photos a signed-in buyer can access.
- Single-photo purchases unlock only that `photo_id`.
- Active Unlimited subscriptions unlock downloads for any photo original, but
  not arbitrary vault browsing.
- Your admin account can see/manage everything and download all originals.

Signed URLs:

- R2 secrets are used only in server route handlers.
- The browser asks the server for vault upload/download or original
  preview/download URLs.
- The server validates owner/admin, purchase, subscription, or explicit vault
  share access before signing.
- Signed URLs are short-lived and point at private R2 objects, so guessing a file
  URL does not grant access.

---

## Build / deploy

```bash
npm run build
npm start
```

Deployed on Vercel. Cloudflare R2 hosts the photography assets — they never
pass through the Vercel build.
