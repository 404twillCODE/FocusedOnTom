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
localhost or publish to other visitors. Original photographs and a TE Visuals
feed have not been connected.

The included landscape is credited reference imagery from Wilder With You:
https://www.wilderwithyou.com/blog/how-to-spend-2-days-in-lake-placid-new-york-the-perfect-weekend-itinerary
It is not Tom's photograph, and this package does not grant rights to that image.
Replace it with your own photograph for your public portfolio. Google Fonts
loads online; the site has fallback fonts when offline.

For static hosting, serve the contents of `dist` at the domain root. The package
contains no account credentials or hosting identity.
