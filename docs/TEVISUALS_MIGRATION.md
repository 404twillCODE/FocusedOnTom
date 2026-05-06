# TE Visuals migration

FocusedOnTom no longer owns photography uploads. **TE Visuals** is the source
of truth for galleries, originals, purchases, licensing, and full-resolution
downloads. FocusedOnTom only displays Tom-attributed public photos and
forwards purchases to TE Visuals.

This doc is the audit + migration checklist. Nothing is deleted automatically.

---

## What changed in code

- New typed contract in `lib/tevisuals/types.ts` describing the catalog,
  checkout, and download-grant endpoints FocusedOnTom expects from TE Visuals.
- New server-only client in `lib/tevisuals/client.ts` that fetches the
  catalog through Next 16's data cache (`revalidate=3600`, tag
  `tevisuals:catalog`) and **filters every response to
  `photographer === "tom"` + `visibility === "public"`**. Eric and "team"
  photos are dropped at the boundary so they can never appear on FOT.
- New async data layer in `lib/photography-source.ts`. Photography pages call
  `loadPhotographyData()` / `loadCategory()` / `loadEvent()` / `loadPhotoById()`
  / `loadRecentPhotos()` and the layer picks TE Visuals or the bundled
  `lib/photography-manifest.json` based on `PHOTOGRAPHY_SOURCE`.
- All FOT photography pages (`app/page.tsx`, `app/photography/page.tsx`,
  `app/photography/[category]/...`, `app/photography/favorites`,
  `app/photography/print/[photoId]`, `app/photography/stats`) are now server
  components that fetch through the source layer; client subtrees
  (`*-view.client.tsx`) keep all animations + interactivity.
- Admin force-refresh route at `POST /api/admin/photography/sync` calls
  `revalidateTag("tevisuals:catalog")` and re-pulls. Returns counts.
- `app/api/photo/checkout` forwards to TE Visuals' checkout when
  `PHOTOGRAPHY_SOURCE=tevisuals`. Stripe path is preserved otherwise.
- `app/api/photo/original/[photoId]` forwards to TE Visuals' download-grant
  API when enabled. FOT R2 originals are never returned in that mode.
- `app/api/photo/download/[token]` returns 410 with a "downloads moved"
  message when enabled, so legacy tokens cannot leak FOT R2 originals.
- `scripts/sync-photography-to-r2.mjs` refuses to run when
  `PHOTOGRAPHY_SOURCE=tevisuals` or `PHOTOGRAPHY_DISABLE_UPLOADS=1`. Use
  `--force-upload` for one-off archival runs only.

## What is preserved

- The local upload script, R2 buckets, manifest JSON, Stripe price IDs,
  webhook, and `photos`/`purchases`/`subscriptions` Supabase tables remain in
  place. They become inert when `PHOTOGRAPHY_SOURCE=tevisuals` and act as the
  outage fallback if TE Visuals is unreachable.
- `/vault` keeps the private R2 bucket under its `vault/` prefix. **Do not**
  delete that bucket; it stores arbitrary user files unrelated to photography.

## TE Visuals contract (must be implemented on TE Visuals)

The TE Visuals app currently exposes:

- `GET /api/portfolio/galleries` (categories: automotive | portraits | weddings | sports)
- `GET /api/portfolio/galleries/[category]/[slug]`

These are close but not enough for FocusedOnTom. TE Visuals must add the
following endpoints (typed in `lib/tevisuals/types.ts`), including the FocusedOnTom
sync routes used for checkout and entitlement:

1. `GET /api/public/photography/catalog?owner=tom&visibility=public`
   Returns `{ generatedAt, baseUrl, galleries: TeVisualsCatalogGallery[] }`.
   Each gallery photo MUST include `photographer: "tom" | "eric" | "team"` so
   FOT's safety filter can re-verify on its own side.

2. `POST /api/public/photography/checkout`
   Body: `{ photoIds, license: "personal" | "commercial" | "unlimited",
   buyerEmail?, successUrl, cancelUrl, metadata? }`. Returns `{ url }` to a
   TE Visuals-hosted Stripe Checkout session.

3. `POST /api/public/photography/download-grant`
   Body: `{ photoId, buyerEmail, grantToken? }`. Returns
   `{ url, expiresAt }` — a short-lived signed URL pointing at the TE Visuals
   private R2 original. TE Visuals checks entitlement (single-photo purchase
   or active Unlimited subscription).

4. **`POST /api/sync/focused-on-tom/entitlement`** (server-to-server, same auth as checkout)
   - Headers: `Authorization: Bearer <FOT_SYNC_API_KEY>` (must match FocusedOnTom `TEVISUALS_API_KEY`).
   - Body: `{ photoId: string, buyerEmail: string }`.
   - Response **200**: `{ owns: boolean, unlimited: boolean }` — whether this email has a paid
     license for that photo or an active Unlimited subscription **in TE Visuals’ database**.
   - FocusedOnTom calls this from `GET /api/photo/entitlements` so the lightbox watermark and
     “Download” state update after TE-hosted Stripe checkout (purchases do not write to FOT Supabase).

Until those routes ship on TE Visuals, FocusedOnTom keeps `PHOTOGRAPHY_SOURCE=local`
and the existing Stripe / R2 path runs unchanged.

## Migration steps (in order)

1. **Implement** the TE Visuals endpoints above (catalog, checkout, download-grant,
   plus `POST /api/sync/focused-on-tom/entitlement` for post-purchase UI on FOT). Per-photo
   `photographer` attribution already exists on `gallery_photos.photographer`
   (`tom` | `eric` | `team`) so the filter is server-side cheap.
2. **Set FocusedOnTom env**:
   - `TEVISUALS_BASE_URL=https://tevisuals.com`
   - `TEVISUALS_API_KEY=…` (optional)
   - Leave `PHOTOGRAPHY_SOURCE=local` for now.
3. **Smoke test** the catalog endpoint: `curl
   "$TEVISUALS_BASE_URL/api/public/photography/catalog?owner=tom&visibility=public"`.
   FOT applies a defensive normalizer + filter; you can also call
   `POST /api/admin/photography/sync` (admin only) and read the response —
   `galleries` and `photos` counts should match what you expect for tom.
4. **Flip the switch** on a preview deploy: `PHOTOGRAPHY_SOURCE=tevisuals`.
   Verify:
   - `/photography` shows the same galleries (re-bucketed via
     `lib/tevisuals/category-map.ts`).
   - `/photography/[category]/[event]` renders TE Visuals photos.
   - "Buy" buttons return a TE Visuals checkout URL.
   - `/my-purchases` and `/api/photo/original/[id]` return TE Visuals download
     URLs (signed, time-limited, on TE Visuals' R2).
   - `/photography/favorites` still works (existing FOT favorite ids will
     resolve only when those ids match TE Visuals photo ids).
5. **Promote to production**.
6. **Set** `PHOTOGRAPHY_DISABLE_UPLOADS=1` in addition to keep the legacy
   sync script blocked even if someone runs `npm run photos:sync` from a dev
   machine without flipping `PHOTOGRAPHY_SOURCE`.
7. **Watch** for one full revalidate window (1h) for any 5xx coming out of
   the TE Visuals catalog. The fallback to the bundled manifest is a safety
   net but it doesn't update; if TE Visuals is flaky, fix it before
   continuing.

## R2 / Supabase / Stripe — what to retire (manual, after migration)

Do **NOT** delete anything in this section automatically. Verify each item
manually after at least one week of running on TE Visuals with no incidents.

### Cloudflare R2 buckets

| Bucket                          | Purpose                                | Action after migration |
| ------------------------------- | -------------------------------------- | ---------------------- |
| `focusedontom-photos` (public)  | Compressed gallery WebPs               | Keep read-only for ~30 days as outage fallback. Then delete via Cloudflare dashboard. Confirm no inbound links from social/email first. |
| `focusedontom-vault-private`    | Private originals + `/vault/*` files   | **Do NOT delete.** Photography originals can be removed under `originals/` after confirming TE Visuals has its own copies; the `vault/*` prefix stays. |
| Legacy `focusedontom-private`   | Pre-rename old originals (if exists)   | Same as above for any lingering `originals/` keys. |

Practical sequence:
1. List `originals/` keys in `focusedontom-vault-private` and verify TE
   Visuals has each photo by `photographer === "tom"` cross-reference.
2. Move (don't delete) `originals/*` to a separate `archived/photo-originals/`
   prefix in the same bucket. This makes accidental access fail loudly.
3. After 30 days of no access logs to that prefix, delete.

### Supabase tables (`photo_commerce_schema.sql`)

| Table                        | Action |
| ---------------------------- | ------ |
| `photos`                     | Keep until you're sure no FOT page reads it. The `photo-access.ts` helpers reference it; once `PHOTOGRAPHY_SOURCE=tevisuals` is steady, these helpers are bypassed. Drop the table only after you remove the helpers. |
| `purchases` / `purchase_items` | Keep as historical record of FOT-issued purchases. New purchases live on TE Visuals. |
| `photo_orders` (legacy)      | Keep historical. New orders never write here. |
| `subscriptions` / `photo_subscriptions` | Keep historical. Once Stripe webhook is disabled (next bullet), no new rows. |
| `photo_likes` / `photo_favorites` | Keep — favorites still work as long as TE Visuals photo ids stay stable. |

### Stripe

- Keep `STRIPE_*` env vars, products, and prices in place for now —
  `/api/photo/checkout` falls back to them if `PHOTOGRAPHY_SOURCE` is ever
  flipped back to `local` for an emergency.
- Do **not** delete the `whsec_…` webhook from
  `/api/stripe/webhook` until TE Visuals has fully owned at least one
  monthly Unlimited renewal cycle.

### Code-level cleanup (later, separate PRs)

Once TE Visuals has been the source of truth for ≥30 days:

- Remove `scripts/sync-photography-to-r2.mjs`, `scripts/verify-photography-manifest-cdn.mjs`,
  the `photos:*` scripts in `package.json`, and the `dev` script's parallel
  sync.
- Remove `lib/r2.ts`'s photography-only call sites; keep R2 client only for
  `/vault`. (Vault uses the same private bucket but its own prefix.)
- Delete `lib/photography-manifest.json` (or shrink it to an empty fallback
  shell) and the manifest-parsing branch in `lib/photography.ts`.
- Drop `app/api/photo/checkout` Stripe branch, `app/api/photo/download/[token]`,
  `app/api/photo/entitlements`, and the FOT-side `subscriptions` /
  `photo_orders` tables once historical access is no longer needed.
- Remove `STRIPE_PRICE_*` env vars and the photography Stripe products.
