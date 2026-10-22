import { GET as photos } from "../api/photos.js";
import { GET as preview } from "../api/photo-preview.js";
import { GET as portfolio } from "../api/portfolio-photos.js";

// This plugin runs only inside the local Node server. Credentials never reach Vite's client bundle.
export function localPhotoApi() {
  for (const file of [".env.local", ".env.photos.local"]) {
    try {
      process.loadEnvFile(file);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return {
    name: "local-photo-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        if (
          ![
            "/api/photos",
            "/api/photo-preview",
            "/api/portfolio-photos",
          ].includes(url.pathname)
        )
          return next();
        if (!["GET", "HEAD"].includes(req.method)) {
          res.writeHead(405);
          return res.end("Method not allowed");
        }
        try {
          let response;
          if (url.pathname === "/api/portfolio-photos")
            response = await portfolio();
          else if (process.env.FOT_SYNC_API_KEY?.trim())
            response =
              url.pathname === "/api/photos"
                ? await photos()
                : await preview(new Request(url));
          else
            response = await fetch(
              new URL(url.pathname + url.search, "https://focusedontom.com"),
              { signal: AbortSignal.timeout(20000), redirect: "error" },
            );
          res.writeHead(response.status, {
            "Content-Type":
              response.headers.get("content-type") || "application/json",
            "Cache-Control": "no-cache",
          });
          res.end(
            req.method === "HEAD"
              ? undefined
              : Buffer.from(await response.arrayBuffer()),
          );
        } catch {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "The live photo library is temporarily unavailable.",
            }),
          );
        }
      });
    },
  };
}
