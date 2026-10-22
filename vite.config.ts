import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { localPhotoApi } from "./scripts/local-photo-api.mjs";

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const routes = JSON.parse(
  readFileSync(resolve("./frontend/routes.json"), "utf8"),
) as { path: string }[];

export default defineConfig({
  root: resolve("./frontend/"),
  publicDir: resolve("./new-site/"),
  plugins: [react(), localPhotoApi()],
  server: { host: "127.0.0.1", port: 3851, strictPort: true },
  build: {
    outDir: resolve("./build/"),
    emptyOutDir: true,
    rolldownOptions: {
      input: routes.map((route) =>
        resolve("./frontend" + route.path + "index.html"),
      ),
    },
  },
});
