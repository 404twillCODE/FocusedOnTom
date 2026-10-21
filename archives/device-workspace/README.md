# Focused on Tom — device workspace portfolio

The active redesign is in `dist/index.html`, `dist/scenes.css`, and `dist/scenes.js`.
The photography library is fetched automatically from TEVisuals through the server.

## Run the archived websites (Windows PowerShell)

Dependencies for both tracked archives have been installed in this checkout.
Open a separate terminal for each website. All commands below start from any
folder and use separate ports, so the sites can run together. Press Ctrl+C in
the terminal to stop a site. Use Node.js 22 or newer for the supported dependency
versions; the installed Node.js 20.19.5 also passed the local startup checks.
Using npm.cmd avoids PowerShell script execution-policy errors.

### Explore / portfolio archive (old/)

```powershell
cd C:\Developer\Personal\Websites\focusedontom
npm.cmd run dev:old
```

Open http://localhost:3001. Includes /explore, /photos, /projects, and /websites.
Without old/.env.local Supabase settings, public Explore pages display empty
lists and a preview notice. Authentication, admin editing, and stored Explore
records require the original Supabase project; see old/docs/explore.md and
old/.env.example. No database is seeded or changed by these startup commands.

### Photography / workout archive (legacy-site/)

```powershell
cd C:\Developer\Personal\Websites\focusedontom
npm.cmd run dev:legacy
```

Open http://localhost:3002. Includes /photography, /dev, /skills, /lifestyle,
and /workout. Startup uses the committed photography manifest and does not
upload photos. Account, cloud storage, payment, and other connected features
need their original settings in legacy-site/.env.local; see its .env.example.
Photo sync remains available explicitly with npm run photos:sync, or
npm run dev:with-photo-sync from legacy-site/.

### Original nested checkout (focusedontom/; local only)

This older, separate Git checkout was already present on this computer. It is
not part of the parent repository and is ignored there so it is not accidentally
added as a nested repository. Its local configuration was adjusted for this folder.

```powershell
cd C:\Developer\Personal\Websites\focusedontom
npm.cmd run dev:original
```

Open http://localhost:3003.

### Current website

```powershell
cd C:\Developer\Personal\Websites\focusedontom
npm.cmd run dev
```

Open http://127.0.0.1:3851. The live photo feed uses the root .env.local settings.
The current pages load, but /api/photos returned 503 during verification; its
TEVisuals connection still needs working settings (see PHOTO-SYNC.md).

### Reinstalling later

After a fresh pull changes dependencies, install the two tracked archives with:

```powershell
cd C:\Developer\Personal\Websites\focusedontom
npm.cmd run setup:archives
```

For the current site use npm.cmd ci at the repository root. For the optional
nested checkout use npm.cmd --prefix focusedontom ci. The nested checkout is
only available on machines where that separate folder already exists.

The archived Next.js startup commands use webpack for reliable compilation on
this Windows checkout. No production deployment is changed.

## Run locally

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3851. The ignored `.env.local` contains the server-only
read key for the photo feed. See [PHOTO-SYNC.md](PHOTO-SYNC.md) for setup,
refresh timing, watermark protection, purchase links, and deployment details.

The Python static-server command below is only for the archived static pages;
it cannot serve the current photo API.


---

# Focused on Tom

Complete editable source for the latest portfolio, including all four pages,
themes, photo editor, camera simulator, archive, project stories, and outdoor tools.

## Run locally

Extract this ZIP, then open the `focused-on-tom` folder in Cursor or VS Code.
Open a terminal in that folder and run one of these commands:

Windows (with Python installed):

```powershell
py -m http.server 3000 --bind 127.0.0.1 --directory dist
```

Mac or Linux (with Python 3 installed):

```bash
python3 -m http.server 3000 --bind 127.0.0.1 --directory dist
```

Open http://localhost:3000 in your browser. Press Ctrl+C to stop the server.
Use the local server rather than double-clicking index.html: page links and
assets use root-relative URLs. No npm installation or build step is needed.

## Edit the website

- `dist/index.html`: homepage.
- `dist/behind-the-lens/index.html`: photography page.
- `dist/inside-the-code/index.html`: code page.
- `dist/off-the-grid/index.html`: outdoors page.
- `dist/style.css`, `dist/explore.css`, `dist/premium.css`: appearance and animations.
- `dist/app.js`, `dist/explore.js`: original interactions.
- `dist/theme-init.js`, `dist/premium.js`: themes, settings, commands, and discoveries.
- `dist/darkroom.js`: photo editor, gear, and camera demonstrations.
- `dist/archive.js`: reference studies and device-local photo archive.
- `dist/worlds.js`: project stories, map index, boat diagram, loadouts, and homepage additions.

Archived apps stay in this repo for reference:

- `old/` — previous Next.js Explore site
- `legacy-site/` — earlier photography / workout site

This is plain HTML, CSS, and JavaScript. Several expanded sections are rendered
from the JavaScript files. Refresh the browser after editing.

## Notes

Settings, discoveries, photo imports, and drafts are local to the browser and
origin where the site runs. They do not transfer from the hosted website to
localhost or publish to other visitors. The current homepage uses the live TEVisuals feed described in PHOTO-SYNC.md.
Archived pages retain their original static behavior.

The included landscape is credited reference imagery from Wilder With You:
https://www.wilderwithyou.com/blog/how-to-spend-2-days-in-lake-placid-new-york-the-perfect-weekend-itinerary
It is not Tom's photograph, and this package does not grant rights to that image.
Replace it with your own photograph for your public portfolio. Google Fonts
loads online; the site has fallback fonts when offline.

For static hosting, serve the contents of `dist` at the domain root. The package
contains no account credentials or hosting identity.
