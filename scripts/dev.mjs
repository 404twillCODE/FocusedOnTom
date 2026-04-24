#!/usr/bin/env node
/**
 * Starts `next dev` and the photography R2 sync at the same time.
 * The site is available immediately; the manifest updates when the sync
 * finishes (refresh the browser if galleries still look stale).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const syncScript = path.join(ROOT, "scripts", "sync-photography-to-r2.mjs");

/** @type {import("node:child_process").ChildProcess | null} */
let syncProc = null;
/** @type {import("node:child_process").ChildProcess | null} */
let nextProc = null;

function killChild(proc, sig = "SIGTERM") {
  if (!proc?.pid) return;
  try {
    proc.kill(sig);
  } catch {
    /* ignore */
  }
}

function shutdown() {
  killChild(syncProc);
  killChild(nextProc);
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

console.log(
  "[dev] Next.js + photography sync running in parallel (sync will keep logging in this terminal)"
);
console.log(
  "[dev] when you see “photos sync finished”, refresh if new photos don’t show yet"
);

syncProc = spawn(process.execPath, [syncScript, "--soft-env"], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});

syncProc.on("exit", (code, signal) => {
  if (signal) {
    console.warn(`[dev] photos:dev stopped (${signal})`);
  } else if (code !== 0 && code !== null) {
    console.warn(`[dev] photos:dev exited with code ${code}`);
  } else {
    console.log("[dev] photos sync finished — refresh the browser if galleries look stale");
  }
});

nextProc = spawn(process.execPath, [nextBin, "dev"], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});

nextProc.on("exit", (code, signal) => {
  killChild(syncProc, "SIGTERM");
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
