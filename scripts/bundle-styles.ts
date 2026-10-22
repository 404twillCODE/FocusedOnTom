import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { transform } from "lightningcss";
import type { Plugin } from "vite";

/** Preserve cascade order while replacing serial public CSS requests with one asset. */
export function bundleStyles(publicDirectory: string): Plugin {
  const assets = new Map<string, Uint8Array>();
  return {
    name: "portfolio-styles",
    apply: "build",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      async handler(html) {
        const links = [
          ...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g),
        ];
        if (!links.length) return html;
        const sources = links.map(
          (match) => /href=["']([^"']+)/.exec(match[0])![1],
        );
        const files = await Promise.all(
          sources.map((href) =>
            readFile(
              resolve(publicDirectory, "." + href.split("?")[0]),
              "utf8",
            ),
          ),
        );
        const css = transform({
          filename: "theme.css",
          code: Buffer.from(
            files.join("\n").replace(/@charset\s+["'][^"']+["'];/g, ""),
          ),
          minify: true,
        }).code;
        const name =
          "assets/theme-" +
          createHash("sha256").update(css).digest("hex").slice(0, 12) +
          ".css";
        assets.set(name, css);
        let first = true;
        return html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g, () => {
          if (!first) return "";
          first = false;
          return `<link rel="stylesheet" href="/${name}" data-style-sources="${sources.join("|")}">`;
        });
      },
    },
    generateBundle: {
      order: "post",
      handler() {
        for (const [fileName, source] of assets)
          this.emitFile({ type: "asset", fileName, source });
      },
    },
  };
}
