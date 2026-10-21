# Focused on Tom

The active portfolio is in **new-site/**. It is a new design built around Tom's
photography, coding projects, and personal background. The current direction is a dark,
scroll-driven camera-viewfinder / developer-workspace experience.

## Start the new website

From a fresh Windows PowerShell terminal:

```powershell
cd C:\Developer\Personal\Websites\focusedontom
npm.cmd run dev
```

Open http://127.0.0.1:3851. Stop with Ctrl+C.
Dependencies are already installed in this checkout. On another machine, use
Node.js 22 or newer and run npm.cmd ci first.

The Minecraft hub is at http://127.0.0.1:3851/minecraft/ and uses the same server.
Its hub, mod pages, and crafting guides live in `new-site/minecraft/`.
`theme.css` supplies the shared portfolio styling; `experience.js` handles navigation,
entrances, and the scrolling block. The three guides retain their recipes and controls.
The portfolio and all Minecraft pages share `new-site/shared-navigation.css` and the
same Photography, Code, About, and contact navigation.

## Previous websites

Use a separate terminal for each command, after changing to this repository.

| Version | Source folder | Command | Address |
| --- | --- | --- | --- |
| Previous device workspace design | archives/device-workspace/ | npm.cmd run dev:previous | http://127.0.0.1:3852 |
| Explore / portfolio archive | old/ | npm.cmd run dev:old | http://localhost:3001 |
| Photography / workout archive | legacy-site/ | npm.cmd run dev:legacy | http://localhost:3002 |
| Original separate local checkout | focusedontom/ | npm.cmd run dev:original | http://localhost:3003 |

The original separate checkout is local only and is ignored by the parent repo.
Install the tracked Next.js archives again with npm.cmd run setup:archives.
The previous design's dist, APIs, server, scripts, dependency lockfile and Vercel
configuration are preserved in archives/device-workspace/. The old root dist/
is also retained as an additional untouched copy.

## Edit the new portfolio

- new-site/index.html: page structure and personal copy.
- new-site/style.css: base components and gallery/dialog styles.
- new-site/experience.css: the dark design, cinematic scenes, filmstrip and responsive layouts.
- new-site/scroll-experience.js: scroll choreography, ambient particles, chapter rail and pointer effects.
- new-site/app.js: gallery filters, photo viewer, project data, navigation and contact.
- new-site/contact-form.js: validated Formspree delivery, errors, duplicate-send guard and receipt.
- new-site/gallery.css and photo-zoom.js: grouped albums, thumbnail previews and draggable zoom.
- new-site/catalog.json: complete metadata snapshot with clean public source image URLs.
- new-site/hero-selections.json: reference IDs for the three selected hero photographs.
- new-site/liquid-glass.css: dark glass surfaces across navigation, albums and projects.
- new-site/cinematic-glass.css: scroll chapter choreography.
- new-site/glass-optics.js: inactive earlier refraction experiment.
- new-site/refinements.css: normal-flow photo collections and the interactive project workbench.
- new-site/personal.css: dark glass navigation, native cursors and personal animated details.
- new-site/assets/cursors/: section-specific native SVG cursor artwork.
- new-site/assets/: photo previews, project screenshots, portrait and local fonts.
- scripts/new-site-server.mjs: development server.

The gallery renders all 531 photographs from its bundled catalog immediately,
then refreshes through /api/portfolio-photos every 15 seconds while visible.
The feed reads Tom's album metadata from TE Visuals and matches originals in
Cloudflare R2 under `private/originals/tom/`, using capture times to disambiguate
duplicate filenames. The hero, album cards and viewer display TE Visuals' compressed
2400px WebP exports directly from Cloudflare CDN, without the added watermark.
Original JPEG references and dimensions remain in the catalog for source matching.
The bundled catalog remains
available when the live feed is unavailable.
Purchase/licensing links still come from the existing TEVisuals catalog.
Only Tom-attributed public portfolio photographs are included. The contact form uses the site's existing
Formspree endpoint, `mdaladkg`, whose notification inbox is `twj2390@gmail.com`.
The browser sends trimmed name, email and message fields with a clear subject and
source; Formspree uses the visitor's email as the reply address. Blank/invalid
notes do not send, and failed sends retain the draft. A sent receipt appears only
after Formspree confirms acceptance. The single owner-approved delivery test on
October 21, 2026 was received in that Gmail inbox. Automated contact tests use a
fake transport and never send email.

The opening scene keeps its floating-photo composition and zooms into the selected
lake photograph from Camping (9a8c7263-b02a-4d6c-a593-24db3ff4a4ce).
The hero displays the exact owner-selected BMW, blue Shelby and lake photographs.
The photography section displays every album from the live catalog, including
Camping, Adam LZ World Tour, Buffalo Cars And Coffee, Gas Station Shoot,
Chrysler 300 and Sylvan Beach. New live albums are included automatically.
Its cards sit in a normal grid: page scrolling never advances or pins the gallery.

The coding section is an interactive workbench. Select a project in the list to
change the preview, then use Explore project to open its details. On larger
screens (at least 1050 by 700), its scroll stage briefly pins and releases into
About. Smaller screens use normal document flow. All other chapter entrances
use scroll-driven depth, typography movement and image parallax; albums never
advance sideways with page scrolling. The floating navbar, complete photo cards, project index and preview use clear
dark optical surfaces. Chromium gets actual SVG backdrop displacement maps at
rounded edges, with photo distortion masked to a narrow rim. Text and photo
centers remain sharp. Maps regenerate on resize, not on mouse movement. Other
browsers use translucent blur as a compatibility fallback. The visual reference
is Apple’s material guidance: https://developer.apple.com/design/human-interface-guidelines/materials.
Native SVG cursors change by section and modal; the JavaScript cursor follower
has been removed. Personal extras about CS at SUNY Poly, the Sony α6400 and car photography are
inside the closed “Outside the workspace” disclosure in About. They no longer
interrupt the flow from photography to coding. Ambient
particles, animated viewfinder rings, hover effects and the hero scroll scene
remain. On phones, collections and project controls flow vertically.
Reduced-motion settings and the footer motion toggle remove continuous effects
and the hero pinned sequence. Keyboard photo navigation and share links remain.

## Production releases

The Vercel project is `focusedontom` (`prj_UUbS0mg1AryOnuC8F7BLdrAR4Ngy`)
in `404twillcodes-projects`, with `new-site/` as its static output and the
server-side photo endpoints under `api/`. Source is pushed to
`404twillCODE/focusedontom`, branch `master`.

Releases are manual: Git deployments remain disabled in `vercel.json`, and the
Vercel Git connection remains disconnected. Run `npm test`, commit and push,
then stage the production build with `vercel deploy --prod --skip-domain` in
the linked project. Verify the staged page and `/api/portfolio-photos` before
promoting that exact deployment with `vercel promote <deployment-url>`.
Environment files and `.vercel/` are ignored and must never be committed.

Font licenses are included alongside the locally hosted fonts in
new-site/assets/fonts/. The archived photo server setup is described in
PHOTO-SYNC.md and archives/device-workspace/PHOTO-SYNC.md.

The new portfolio uses `/api/portfolio-photos` and compressed, watermark-free WebP
images for its hero, album covers, gallery and viewer. All six albums (531
Tom-attributed photographs) are bundled in `new-site/catalog.json` as a fallback.
The corresponding Cloudflare originals are matched separately; their verified
dimensions reach 6000px, with the selected lake original at 5805 × 3870.
Run `node scripts/sync-portfolio-photos.mjs` to refresh the bundled catalog and
the three selected hero sources. The previous site's watermark API is unchanged.

Automatic discovery of future originals requires bucket-scoped read-only R2
credentials in the ignored `.env.photos.local` file (loaded by the development
server), or the deployment's server environment:

```
FOT_R2_ACCOUNT_ID=your-account-id
FOT_R2_ACCESS_KEY_ID=your-readonly-access-key
FOT_R2_SECRET_ACCESS_KEY=your-readonly-secret
FOT_R2_BUCKET=tevisuals
```

Without these credentials, existing verified original references still work,
but newly uploaded original object keys cannot be discovered automatically.
The API reports `originalsSync: "live"` when the live R2 listing is active, or
`"verified-inventory"` when using the saved original-object inventory. No token
is included in browser code. No deployment or Git push is needed for local sync.
`imageDelivery: "cloudflare-webp"` confirms compressed display delivery. The R2
connection is configured locally and in Vercel Production and Preview settings;
automatic Git deployments remain disabled; production updates use the manual
staged-release workflow above.
