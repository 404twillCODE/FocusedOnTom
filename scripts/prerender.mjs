import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { createElement, StrictMode, Suspense } from "react";
import { renderToString } from "react-dom/server";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { pages } = await server.ssrLoadModule("/src/routes.ts");
  const { MotionProvider } = await server.ssrLoadModule(
    "/src/motion/MotionProvider.tsx",
  );
  for (const [path, page] of Object.entries(pages)) {
    const { default: Page } = await page.load();
    const markup = renderToString(
      createElement(
        StrictMode,
        null,
        createElement(
          MotionProvider,
          null,
          createElement(Suspense, { fallback: null }, createElement(Page)),
        ),
      ),
    );
    const file = new URL("../build" + path + "index.html", import.meta.url);
    const html = await readFile(file, "utf8");
    await writeFile(
      file,
      html.replace(
        '<div id="root"></div>',
        () => '<div id="root">' + markup + "</div>",
      ),
    );
    console.log("Pre-rendered", path);
  }
} finally {
  await server.close();
}
