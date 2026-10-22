# Focused on Tom

The active website uses **React 19, TypeScript, and Vite**. The migration preserves the existing design, local fonts, photographs, glass surfaces, hero choreography, stars, and responsive layouts.

## Local development

Use Node.js 22.12 or newer (Vercel uses the existing project runtime):

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3851. All Minecraft pages use the same server.

```powershell
npm test
npm run build
npm run verify:migration
npm run preview
```

The production build pre-renders all nine pages to HTML, then React hydrates them. This preserves immediate readable content, metadata, and crafting guides instead of waiting for JavaScript to draw the page. Each page loads its own component bundle.

## Source layout

- `frontend/src/pages/`: the home page, restored tools page, Minecraft hub, three mod pages, and three wikis as TSX.
- `frontend/src/components/`: shared navigation, project workbench, portfolio filters, grouped albums, photo viewer, contact card, and orange ticker.
- `frontend/src/lib/`: typed projects, gallery models, album grouping, contact validation/delivery, and mod search helpers.
- `frontend/src/motion/`: shared motion preferences and effects. The existing canvas drawing algorithms are retained as isolated JavaScript engines, with explicit cleanup when React unmounts them. React owns the UI and event state.
- `new-site/`: public styles, photographs, fonts, Minecraft textures, catalog, and logo. The old browser controllers are no longer shipped.
- `api/` and `scripts/`: existing server-side photo integration, original matching, preview processing, and sync jobs. Private keys remain on the server.
- `archives/pre-react-site/`: the previous HTML, JavaScript, and styles, excluded from deployment. Photos and fonts remain shared in `new-site/`; Git history preserves the complete original version.

## Preserved connections and behavior

The bundled catalog contains all 531 Tom-attributed photographs. The portfolio refreshes through `/api/portfolio-photos` every 15 seconds while visible, retaining the snapshot if the live feed is unavailable. An open album stays stable during background refresh. All album photographs render without a load-more button; the browser loads offscreen image pixels as needed.

TE Visuals section labels, image sources, purchase/licensing links, and original matching remain intact. The viewer supports keyboard arrows, shared photo URLs, click-to-zoom, bounded dragging, closing from the space around a photo, and enlarged thumbnail previews. The mobile navbar retains capsule expansion before opening its hamburger menu.

The contact card uses the same Formspree endpoint (`mdaladkg`) and inbox (`twj2390@gmail.com`). Validation prevents invalid sends, duplicate sends are blocked, errors retain the draft, and a receipt appears only after provider confirmation. Tests use a fake transport and send no email.

Existing photo API authentication, Cloudflare R2 credentials, and TE Visuals sync configuration remain unchanged. Use ignored `.env.local` and `.env.photos.local` files for local server configuration. No secret is included in Vite's browser bundle.

## Performance and tools

Scroll effects cache their elements, read geometry before changing styles, and skip unchanged updates. Reveal observers inspect newly added elements instead of rescanning the page when a counter changes. Album grids are memoized, so navigating the viewer does not rebuild hundreds of photo tiles. Background animation pauses behind an open gallery and when the page is hidden; offscreen hero animations also pause. Canvas resolution is capped for desktop and mobile while retaining the existing star effects and reduced-motion controls.

The same complete font faces are served as WOFF2, reducing their combined size from 602,236 to 202,268 bytes. Production builds combine each page's stylesheets in their original cascade order into one minified, content-hashed asset. Development retains individual stylesheets. A development-only timing output helps compare scroll updates and is removed from production builds.

`/tools/` restores the two original saved links in the current design. It is reachable from the home footer and retains noindex metadata and headers.

## Publishing

The existing Vercel project is `focusedontom` in `404twillcodes-projects`, and GitHub uses `404twillCODE/focusedontom`, branch `master`.

Vercel runs `npm run build` and serves `build/`, with the same server functions under `api/`. The earlier tracked `dist/` archive remains separate. Automatic Git deployments remain disabled. After checks pass, commit and push, stage a manual production deployment with `--prod --skip-domain`, verify the pages and read-only photo APIs, then promote that exact build.

## Earlier websites

The previous device workspace is in `archives/device-workspace/` (`npm run dev:previous`). Earlier Next.js versions remain in `old/` (`npm run dev:old`) and `legacy-site/` (`npm run dev:legacy`). The original separate checkout is local-only and ignored. Their dependencies and build output are excluded from the active application.

Font licenses remain alongside the locally hosted fonts in `new-site/assets/fonts/`. Existing photo sync details remain in `PHOTO-SYNC.md`.
