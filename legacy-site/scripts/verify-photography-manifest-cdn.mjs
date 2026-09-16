#!/usr/bin/env node
/**
 * HEAD-check every photo URL in lib/photography-manifest.json against the CDN.
 * Use after moving folders or interrupted syncs to find 404s / timeouts.
 *
 *   node scripts/verify-photography-manifest-cdn.mjs
 *   node scripts/verify-photography-manifest-cdn.mjs --match=Subaru-WRX
 *   node scripts/verify-photography-manifest-cdn.mjs --match=Gas-Station-Shoot --concurrency=4
 *
 * Requires network. Loads .env.local for nothing (URLs are absolute in manifest).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "lib", "photography-manifest.json");

const args = process.argv.slice(2);
let match = "";
let concurrency = 6;
for (const a of args) {
  if (a.startsWith("--match=")) match = a.slice("--match=".length);
  if (a.startsWith("--concurrency=")) {
    const n = Number.parseInt(a.slice("--concurrency=".length), 10);
    if (Number.isFinite(n) && n > 0) concurrency = Math.min(20, n);
  }
}

const TIMEOUT_MS = 25_000;

function collectUrls(manifest) {
  const urls = new Set();
  for (const folder of manifest.folders ?? []) {
    if (folder.cover) urls.add(folder.cover);
    for (const p of folder.photos ?? []) {
      if (p.url) urls.add(p.url);
    }
  }
  let list = [...urls].sort();
  if (match) list = list.filter((u) => u.includes(match));
  return list;
}

async function headOne(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      redirect: "follow",
    });
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return {
      url,
      status: 0,
      ok: false,
      err: (e && e.name === "AbortError" ? "timeout" : String(e?.message ?? e)),
    };
  } finally {
    clearTimeout(t);
  }
}

async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx]);
    }
  }
  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

async function main() {
  const raw = await readFile(MANIFEST, "utf8");
  const manifest = JSON.parse(raw);
  const urls = collectUrls(manifest);
  console.log(
    `[photos:verify-cdn] ${urls.length} URL(s)${match ? ` (filter "${match}")` : ""} · HEAD timeout ${TIMEOUT_MS}ms · concurrency ${concurrency}`
  );
  if (urls.length === 0) {
    console.log("Nothing to check.");
    process.exit(0);
  }

  const results = await pool(urls, concurrency, headOne);
  const bad = results.filter((r) => !r.ok || r.status === 404);
  const ok = results.length - bad.length;
  for (const r of bad) {
    console.log(
      `FAIL ${r.status || "—"} ${r.err ? `(${r.err})` : ""} ${r.url}`
    );
  }
  console.log(`[photos:verify-cdn] OK ${ok} · FAIL ${bad.length}`);
  if (bad.length > 0) {
    console.log(
      "\nRe-upload missing keys: place files under photography/… then run:\n  pnpm run photos:sync\nor force re-upload:\n  pnpm run photos:sync:force"
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
