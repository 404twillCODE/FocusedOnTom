# Live TEVisuals photo library

The portfolio reads Tom's **public** photo catalog through the TEVisuals manifest.
Cloudflare R2 supplies the optimized source previews; TEVisuals remains responsible
for photographer attribution, collection order, camera settings, capture dates,
prices, purchases, and gated original downloads.

## Run locally

Install dependencies with `npm ci`. Store the read-only key in the ignored
`.env.local` file under `FOT_SYNC_API_KEY`, then run `npm run dev`.
The server runs at http://127.0.0.1:3851. A plain Python static server cannot run
the live API. No key belongs in `dist`, browser JavaScript, or Git history.

## Sync behavior

`GET /api/photos` reads every cursor page from TEVisuals. The server keeps a
60-second cache; visible browser tabs check every 60 seconds, and refresh when
returning to a tab. New uploads and removals normally appear within two minutes.
An album currently being viewed keeps its place; pending collection updates apply
when the visitor returns to All collections. Hidden/private and non-Tom photos
are excluded by TEVisuals, with an additional photographer check here.

There is no static photo snapshot fallback. If authentication or the source fails,
the server reports unavailability instead of falling back to raw photo URLs.

## Previews and purchases

The catalog exposes local preview URLs and public TEVisuals photo/checkout links.
`GET /api/photo-preview` only accepts a catalog photo ID and a fixed thumbnail or
large size, never a caller-supplied upstream URL. It fetches an approved preview,
limits dimensions, composites a T&E Visuals watermark into pixels, and strips
embedded metadata. Camera settings remain visible in the photo caption.
This app never requests original-file keys or buyer entitlements.

Buy and commercial-license links open the exact photo's checkout on TEVisuals.
Sign-in, prices, payment, license verification, and access to full-resolution files
remain on TEVisuals. No payment or checkout was completed during verification.

Displayed previews can still be copied or screenshotted. Baked-in watermarks
protect the preview presentation; private originals require TEVisuals' download
authorization. Existing unwatermarked public CDN URLs elsewhere are not revoked
by this portfolio change.

## Deployment

The root `api/` routes use Vercel Node.js functions and require `npm ci` to install
Sharp. Set `FOT_SYNC_API_KEY` on the target deployment to the **read-only** manifest
key. The matching source variable on TEVisuals is `FOT_MANIFEST_READ_KEY`; that key
is accepted by the manifest route only and cannot call commerce sync endpoints.
The original `FOT_SYNC_API_KEY` on TEVisuals remains valid and unchanged.

## Verification

`npm test` covers cursor pagination, newly published/removed photos, Tom-only
filtering, metadata and purchase links, fail-closed auth errors, preview URL
allowlists, and actual watermark pixels with bounded image dimensions.

The preview renderer uses bundled vector letter outlines, so its watermark does
not depend on fonts installed on the server. Processed previews have a bounded
memory cache; concurrent requests for the same image share one render. Catalog
authorization is still checked before returning any cached image.

The local preview can use `FOT_LOCAL_CATALOG` to point to an ignored JSON file
containing the public catalog and approved public preview sources. The current
local fixture includes all six collections and 531 photos. This option is used
only by `scripts/dev-server.mjs`; the production API retains authenticated live
sync. Do not commit the local environment or fixture as production configuration.

Collection routes use `/photography/<category>/<collection>` and individual
photos add `?photo=<id>`. Browser Back closes the current detail first. Arrow
navigation replaces the photo query without adding an entry for every image.

## TEVisuals feed release

The approved source update is saved on GitHub branch
`codex/focused-on-tom-read-feed`, commit `33a78b6`, and deployed to
`www.tevisuals.com` (deployment `dpl_3XPbQMgA7gEoKrut1tLLSeT3REsB`).
It was based on the previously serving production commit `b9c176c`, not the
failed remote-main release. Preserve the manifest-only auth changes in
`lib/syncAuth.ts` and the manifest route when preparing future TEVisuals releases.

The Focused on Tom production project uses the read-only `FOT_SYNC_API_KEY`
server variable for the live library. Local catalog fixtures are never deployed.
