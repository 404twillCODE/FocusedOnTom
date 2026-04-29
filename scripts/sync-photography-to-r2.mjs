#!/usr/bin/env node
/**
 * sync-photography-to-r2.mjs
 * ----------------------------------------------------------------------------
 * Local build + upload pipeline for the photography section.
 *
 * What it does:
 *   1. Scans the local /photography folder (or /public/photography as a
 *      fallback) recursively.
 *   2. For every .jpg / .jpeg / .png / .webp it finds:
 *        a. Extracts EXIF from the original file (exifr).
 *        b. Compresses the image to high-quality WebP in memory (sharp,
 *           long-edge 3000px, quality ~82, EXIF orientation baked in).
 *        c. Uploads the WebP to Cloudflare R2 under the same relative path
 *           (e.g. photography/cars/Event/sub/photo.webp).
 *        d. Optionally (ORIGINALS_UPLOAD=true) also uploads the full-size
 *           original JPG under photography-originals/<same path>.
 *   3. Generates lib/photography-manifest.json with folders, photo counts,
 *      EXIF metadata, dimensions, R2 URLs, and event-level meta.
 *
 * Runs from the repo root: `npm run photos:sync`
 *
 * Required env (in .env.local or .env):
 *   CLOUDFLARE_R2_ACCOUNT_ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET
 *   CLOUDFLARE_R2_PUBLIC_URL            (e.g. https://cdn.focusedontom.com)
 *
 * Optional env:
 *   ORIGINALS_UPLOAD=true               upload full-size originals too
 *   PHOTOGRAPHY_SOURCE_DIR=photography  override source folder
 *
 * Flags:
 *   --dry-run     scan + compress but don't upload or write the manifest
 *   --force       ignore the local upload cache and re-upload everything
 *   --verbose     print per-file diagnostics
 *   --no-progress silence periodic heartbeat lines (on by default without --verbose)
 *
 * Env:
 *   PHOTOS_SYNC_PROGRESS=0            same as --no-progress
 *   PHOTOS_SYNC_PROGRESS_EVERY=10     log every N processed images (default 10)
 * ----------------------------------------------------------------------------
 */

import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import dns from "node:dns/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import exifr from "exifr";
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local first (preferred), fall back to .env.
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has("--dry-run");
const FORCE = ARGS.has("--force");
const VERBOSE = ARGS.has("--verbose");
// --soft-env: if the Cloudflare env vars aren't configured, log a warning
// and exit 0 without touching the manifest. Used by `npm run photos:dev`
// so missing credentials don't block `next dev`.
const SOFT_ENV = ARGS.has("--soft-env");
const NO_PROGRESS = ARGS.has("--no-progress");
const SHOW_PROGRESS =
  !NO_PROGRESS && process.env.PHOTOS_SYNC_PROGRESS !== "0";
const PROGRESS_INTERVAL = Math.max(
  1,
  Number.parseInt(process.env.PHOTOS_SYNC_PROGRESS_EVERY ?? "10", 10) || 10
);
const UPLOAD_ORIGINALS =
  process.env.ORIGINALS_UPLOAD === "true" || ARGS.has("--originals");
const INCLUDE_GPS = process.env.PHOTOGRAPHY_INCLUDE_GPS === "true";

const SOURCE_DIR_OVERRIDE = process.env.PHOTOGRAPHY_SOURCE_DIR;
const SOURCE_CANDIDATES = [
  SOURCE_DIR_OVERRIDE ? path.join(ROOT, SOURCE_DIR_OVERRIDE) : null,
  path.join(ROOT, "photography"),
  path.join(ROOT, "public", "photography"),
].filter(Boolean);

const MANIFEST_OUT = path.join(ROOT, "lib", "photography-manifest.json");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "photos-upload-cache.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const WEBP_QUALITY = 82;
const LONG_EDGE_MAX = 3000;

const R2_KEY_PREFIX = "photography"; // object key prefix for optimized WebP
const R2_ORIGINALS_PREFIX = "photography-originals"; // optional prefix
const PACK_UPLOADS_ROOT = "photo-pack-uploads";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function dirHasImages(dir) {
  try {
    const files = await walk(dir);
    return files.length > 0;
  } catch {
    return false;
  }
}

async function pickSourceDir() {
  // Prefer an override or the canonical ./photography/ folder if it has
  // images. Otherwise fall back to the legacy ./public/photography/ folder
  // so existing content keeps working during migration.
  for (const candidate of SOURCE_CANDIDATES) {
    if (!candidate || !existsSync(candidate)) continue;
    if (await dirHasImages(candidate)) return candidate;
  }
  // Nothing had images — return the first existing candidate anyway so the
  // user sees "no images found under …" pointed at the expected path.
  for (const candidate of SOURCE_CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(
      `Missing required env var ${name}. Add it to .env.local (see .env.example).`
    );
  }
  return v.trim();
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function encodeKeyAsUrl(baseUrl, key) {
  // Encode each segment individually so `/` is preserved but spaces/|/etc are
  // percent-encoded.
  const safe = key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${baseUrl.replace(/\/$/, "")}/${safe}`;
}

function titleCaseFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function stableId(relPath) {
  return crypto.createHash("sha1").update(relPath).digest("hex").slice(0, 12);
}

function formatShutter(exposure) {
  if (!exposure || exposure <= 0) return undefined;
  if (exposure >= 1) return `${Number(exposure.toFixed(1))}s`;
  const denom = Math.round(1 / exposure);
  return `1/${denom}s`;
}

function formatAperture(fnum) {
  if (!fnum) return undefined;
  return `f/${Number(fnum.toFixed(1))}`;
}

function formatFocal(fl) {
  if (!fl) return undefined;
  return `${Math.round(fl)}mm`;
}

function formatCamera(make, model) {
  if (!model) return undefined;
  const m = String(model).trim();
  if (!make) return m;
  const mk = String(make).trim();
  if (m.toLowerCase().includes(mk.toLowerCase())) return m;
  return `${mk} ${m}`.trim();
}

function formatMonthYear(iso) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Warn early when the public CDN hostname does not resolve (avoids silent Next /_next/image 500s). */
async function warnIfCdnHostUnresolved(publicUrl) {
  try {
    const { hostname } = new URL(publicUrl);
    await dns.lookup(hostname);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String(/** @type {{ code?: string }} */ (err).code)
        : String(err);
    console.warn(
      `[photos:sync] WARNING: CDN host does not resolve (${code}). R2 uploads are fine, but Next.js will fail fetching images in dev until this hostname works in DNS.`
    );
    console.warn(
      `[photos:sync] Fix: point CLOUDFLARE_R2_PUBLIC_URL and NEXT_PUBLIC_CDN_URL at a working URL (e.g. your bucket’s public *.r2.dev URL from Cloudflare), then re-run sync so lib/photography-manifest.json gets updated URLs.`
    );
  }
}

async function readJson(file) {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function walk(rootDir, relativeDir = "") {
  const dirPath = path.join(rootDir, relativeDir);
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "meta.json") continue;
    const relPath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;
    if (entry.isDirectory()) {
      const nested = await walk(rootDir, relPath);
      files.push(...nested);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    files.push(relPath);
  }
  return files.sort();
}

async function extractExifFromOriginal(absPath, { includeGps } = { includeGps: false }) {
  try {
    const raw =
      (await exifr.parse(absPath, {
        tiff: true,
        ifd0: true,
        exif: true,
        gps: !!includeGps,
        iptc: false,
        xmp: false,
        pick: [
          "Make",
          "Model",
          "LensModel",
          "LensMake",
          "FNumber",
          "ExposureTime",
          "ISO",
          "ISOSpeedRatings",
          "FocalLength",
          "FocalLengthIn35mmFormat",
          "DateTimeOriginal",
          "CreateDate",
          "latitude",
          "longitude",
        ],
      })) ?? {};

    const camera = formatCamera(raw.Make, raw.Model);
    const lens = raw.LensModel ? String(raw.LensModel).trim() : undefined;
    const isoRaw = raw.ISO ?? raw.ISOSpeedRatings;
    const iso = Array.isArray(isoRaw) ? isoRaw[0] : isoRaw;
    const takenAt = raw.DateTimeOriginal
      ? new Date(raw.DateTimeOriginal).toISOString()
      : raw.CreateDate
        ? new Date(raw.CreateDate).toISOString()
        : undefined;

    const exif = {};
    if (camera) exif.camera = camera;
    if (lens) exif.lens = lens;
    if (iso) exif.iso = typeof iso === "number" ? iso : Number(iso) || iso;
    const focal = formatFocal(raw.FocalLength);
    if (focal) exif.focalLength = focal;
    const aperture = formatAperture(raw.FNumber);
    if (aperture) exif.aperture = aperture;
    const shutter = formatShutter(raw.ExposureTime);
    if (shutter) exif.shutterSpeed = shutter;
    return { exif, takenAt };
  } catch (err) {
    if (VERBOSE) console.warn(`  [exif] failed ${absPath}: ${err.message}`);
    return { exif: {}, takenAt: undefined };
  }
}

async function optimizeToWebp(absPath) {
  const pipeline = sharp(absPath, { failOn: "none" })
    .rotate() // honor EXIF orientation and strip the tag
    .resize({
      width: LONG_EDGE_MAX,
      height: LONG_EDGE_MAX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 5 });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, size: data.length };
}

// ---------------------------------------------------------------------------
// R2 / S3 client
// ---------------------------------------------------------------------------

function makeR2Client() {
  const accountId = requireEnv("CLOUDFLARE_R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function r2ObjectExists(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404) return false;
    if (err?.name === "NotFound") return false;
    return false;
  }
}

async function r2Put(client, bucket, key, body, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

// ---------------------------------------------------------------------------
// Event / folder meta
// ---------------------------------------------------------------------------

async function loadMetaForDir(absDir) {
  const metaPath = path.join(absDir, "meta.json");
  if (!(await exists(metaPath))) return null;
  try {
    return JSON.parse(await readFile(metaPath, "utf8"));
  } catch (err) {
    console.warn(`  [meta] could not parse ${metaPath}: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const SOURCE_DIR = await pickSourceDir();
  if (!SOURCE_DIR) {
    console.error(
      `[photos:sync] No source folder found. Create ./photography/ and drop your edited photos in.`
    );
    process.exit(1);
  }

  const isLegacySource =
    path.basename(path.dirname(SOURCE_DIR)) === "public" &&
    path.basename(SOURCE_DIR) === "photography";

  if (isLegacySource) {
    console.log(
      `[photos:sync] NOTE: using legacy source public/photography/. Move your originals to ./photography/ when you get a chance — it's ignored by git and is the new convention.`
    );
  }

  const REQUIRED_ENVS = [
    "CLOUDFLARE_R2_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_BUCKET",
    "CLOUDFLARE_R2_PUBLIC_URL",
  ];
  const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    if (SOFT_ENV) {
      console.warn(
        `[photos:sync] skipping — missing env: ${missing.join(", ")}.`
      );
      console.warn(
        `[photos:sync] the site will load the existing lib/photography-manifest.json. Set these in .env.local when you're ready to sync.`
      );
      return;
    }
    throw new Error(
      `Missing required env var${missing.length > 1 ? "s" : ""} ${missing.join(", ")}. Add to .env.local (see .env.example).`
    );
  }

  const BUCKET = requireEnv("CLOUDFLARE_R2_BUCKET");
  const PUBLIC_URL = requireEnv("CLOUDFLARE_R2_PUBLIC_URL").replace(/\/$/, "");

  await warnIfCdnHostUnresolved(PUBLIC_URL);

  console.log(`[photos:sync] source:  ${path.relative(ROOT, SOURCE_DIR)}`);
  console.log(`[photos:sync] bucket:  ${BUCKET}`);
  console.log(`[photos:sync] cdn:     ${PUBLIC_URL}`);
  console.log(
    `[photos:sync] mode:    ${DRY_RUN ? "DRY RUN" : "live"}${FORCE ? " · force" : ""}${UPLOAD_ORIGINALS ? " · originals" : ""}`
  );

  const client = DRY_RUN ? null : makeR2Client();
  const cache = FORCE ? {} : ((await readJson(CACHE_FILE)) ?? {});
  const nextCache = {};

  const files = await walk(SOURCE_DIR);
  const validFileCount = files.filter((rel) => {
    const parts = rel.split("/");
    return parts.length >= 3 || (parts[0] === PACK_UPLOADS_ROOT && parts.length >= 2);
  }).length;

  if (files.length === 0) {
    if (SOFT_ENV) {
      console.warn(
        `[photos:sync] no images found under ${path.relative(ROOT, SOURCE_DIR)}. Keeping the existing manifest.`
      );
      return;
    }
    console.warn(`[photos:sync] no images found under ${SOURCE_DIR}.`);
  }

  if (
    SHOW_PROGRESS &&
    !VERBOSE &&
    validFileCount > 0 &&
    files.length > 0
  ) {
    console.log(
      `[photos:sync] heartbeat every ${PROGRESS_INTERVAL} file(s) · ${validFileCount} eligible image(s) (use --verbose for per-file, --no-progress to silence)`
    );
  }

  // Collect meta.json files per directory (events + leaf folders)
  const metaByDir = new Map();
  async function ensureMeta(relDir) {
    if (metaByDir.has(relDir)) return metaByDir.get(relDir);
    const abs = relDir ? path.join(SOURCE_DIR, relDir) : SOURCE_DIR;
    const meta = await loadMetaForDir(abs);
    metaByDir.set(relDir, meta);
    return meta;
  }

  // folderPath (e.g. "cars/Event/day-1") → { category, event, photos[], meta }
  const folderMap = new Map();
  // Same shape, but only contains folders under `photography/private/…`. These
  // are intentionally kept out of the public folders/events arrays.
  const privateFolderMap = new Map();

  let totalPhotos = 0;
  let uploadedPhotos = 0;
  let skippedUnchanged = 0;
  const packAssets = [];

  for (const relPath of files) {
    const absPath = path.join(SOURCE_DIR, relPath);
    const parts = relPath.split("/");
    const isPackUpload = parts[0] === PACK_UPLOADS_ROOT;
    if (!isPackUpload && parts.length < 3) {
      console.warn(
        `  [skip] ${relPath} — needs at least category/event/photo structure.`
      );
      continue;
    }
    const category = isPackUpload ? PACK_UPLOADS_ROOT : parts[0];
    const event = isPackUpload ? "pack-assets" : parts[1];
    const subSegments = isPackUpload ? parts.slice(1, -1) : parts.slice(2, -1); // may be []
    const filename = parts[parts.length - 1];
    const folderPath = isPackUpload
      ? [PACK_UPLOADS_ROOT, ...subSegments].join("/")
      : [category, event, ...subSegments].join("/");
    const folderRelToEvent = subSegments.join("/");
    const isPrivate = category === "private";

    // Make sure meta.json for the event and leaf is preloaded (sorted traversal)
    if (!isPackUpload) {
      await ensureMeta(category + "/" + event);
      await ensureMeta(folderPath);
    }

    const st = await stat(absPath);
    const cacheKey = relPath;
    const cached = cache[cacheKey];
    const sig = { mtimeMs: Math.round(st.mtimeMs), size: st.size };

    const ext = path.extname(filename).toLowerCase();
    const baseName = filename.slice(0, filename.length - ext.length);
    const webpRelPath = [
      ...parts.slice(0, -1),
      `${baseName}.webp`,
    ].join("/");
    const webpKey = `${R2_KEY_PREFIX}/${webpRelPath}`;
    const webpUrl = encodeKeyAsUrl(PUBLIC_URL, webpKey);
    const originalKey = `${R2_ORIGINALS_PREFIX}/${relPath}`;

    let entry = null;

    const canReuse =
      !FORCE &&
      cached &&
      cached.mtimeMs === sig.mtimeMs &&
      cached.size === sig.size &&
      cached.webpKey === webpKey;

    if (canReuse) {
      entry = cached.entry;
      skippedUnchanged += 1;
      if (VERBOSE) console.log(`  [skip] ${relPath} (unchanged)`);
    } else {
      // (Re)build
      const { exif, takenAt } = await extractExifFromOriginal(absPath, {
        includeGps: INCLUDE_GPS && !isPrivate,
      });
      const optimized = await optimizeToWebp(absPath);

      if (!DRY_RUN) {
        const alreadyThere = await r2ObjectExists(client, BUCKET, webpKey);
        if (!alreadyThere || FORCE) {
          await r2Put(client, BUCKET, webpKey, optimized.buffer, "image/webp");
          uploadedPhotos += 1;
          if (VERBOSE) console.log(`  [up  ] ${webpKey}`);
        } else if (VERBOSE) {
          console.log(`  [keep] ${webpKey} already in R2`);
        }

        // Always upload originals for private galleries (clients may need
        // the full-resolution files for proofing + ZIP downloads), regardless
        // of the global ORIGINALS_UPLOAD flag.
        if (UPLOAD_ORIGINALS || isPrivate) {
          const origExists = await r2ObjectExists(client, BUCKET, originalKey);
          if (!origExists || FORCE) {
            const origBuf = await readFile(absPath);
            const mime =
              ext === ".png"
                ? "image/png"
                : ext === ".webp"
                  ? "image/webp"
                  : "image/jpeg";
            await r2Put(client, BUCKET, originalKey, origBuf, mime);
            if (VERBOSE) console.log(`  [orig] ${originalKey}`);
          }
        }
      }

      entry = {
        id: stableId(webpRelPath),
        filename: `${baseName}.webp`,
        originalFilename: filename,
        path: webpRelPath,
        url: webpUrl,
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
        folderPath: folderRelToEvent,
        takenAt,
        exif,
      };
      if (exif && (exif.latitude || exif.longitude)) {
        // If exifr returns latitude/longitude at the top level, surface them
        // under `gps` so the UI can pin them on the map. Never emitted for
        // private photos (INCLUDE_GPS && !isPrivate above).
        const lat = Number(exif.latitude);
        const lng = Number(exif.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          entry.gps = { lat, lng };
        }
        delete exif.latitude;
        delete exif.longitude;
      }
      if (isPrivate) {
        entry.private = true;
        delete entry.gps;
      }
    }

    nextCache[cacheKey] = {
      mtimeMs: sig.mtimeMs,
      size: sig.size,
      webpKey,
      entry,
    };

    totalPhotos += 1;

    if (isPackUpload) {
      packAssets.push({
        id: entry.id,
        path: entry.path,
        url: entry.url,
        width: entry.width,
        height: entry.height,
        originalFilename: entry.originalFilename,
        takenAt: entry.takenAt,
        exif: entry.exif,
      });
    } else {
      const activeMap = isPrivate ? privateFolderMap : folderMap;
      let folder = activeMap.get(folderPath);
      if (!folder) {
        folder = {
          path: folderPath,
          category,
          event,
          name: subSegments[subSegments.length - 1] ?? event,
          subPath: folderRelToEvent,
          photos: [],
          isPrivate,
        };
        activeMap.set(folderPath, folder);
      }
      folder.photos.push(entry);
    }

    if (
      SHOW_PROGRESS &&
      !VERBOSE &&
      validFileCount > 0 &&
      (totalPhotos === 1 ||
        totalPhotos % PROGRESS_INTERVAL === 0 ||
        totalPhotos === validFileCount)
    ) {
      const modeTag = DRY_RUN ? "dry-run" : "live";
      console.log(
        `[photos:sync] ${modeTag} ${totalPhotos}/${validFileCount} · uploaded ${uploadedPhotos} · cache ${skippedUnchanged} · ${relPath}`
      );
    }
  }

  // Build manifest
  const folders = [];
  for (const folder of [...folderMap.values()].sort((a, b) =>
    a.path.localeCompare(b.path)
  )) {
    folder.photos.sort((a, b) =>
      a.originalFilename.localeCompare(b.originalFilename, undefined, {
        numeric: true,
      })
    );

    const leafMeta = metaByDir.get(folder.path) ?? {};
    const eventMeta =
      metaByDir.get(`${folder.category}/${folder.event}`) ?? {};

    const title =
      leafMeta.title ??
      (folder.subPath === ""
        ? (eventMeta.title ?? titleCaseFromSlug(folder.event))
        : titleCaseFromSlug(
            folder.subPath.split("/").slice(-1)[0] ?? folder.event
          ));

    const earliestTaken = folder.photos
      .map((p) => p.takenAt)
      .filter(Boolean)
      .sort()[0];

    folders.push({
      path: folder.path,
      category: folder.category,
      event: folder.event,
      name: folder.subPath, // relative to event; "" when photos are at event root
      title,
      photoCount: folder.photos.length,
      cover: folder.photos[0]?.url,
      takenAt: earliestTaken,
      eventTitle: eventMeta.title,
      eventDate: eventMeta.date ?? formatMonthYear(earliestTaken),
      eventLocation: eventMeta.location,
      eventSummary: eventMeta.summary,
      photos: folder.photos,
    });
  }

  // Also surface an events[] array for convenience.
  const eventMap = new Map();
  for (const folder of folders) {
    const eventKey = `${folder.category}/${folder.event}`;
    let ev = eventMap.get(eventKey);
    if (!ev) {
      const meta = metaByDir.get(eventKey) ?? {};
      ev = {
        path: eventKey,
        category: folder.category,
        slug: folder.event,
        title: meta.title ?? titleCaseFromSlug(folder.event),
        date: meta.date,
        location: meta.location,
        summary: meta.summary,
        takenAt: undefined,
        photoCount: 0,
        cover: folder.cover,
        folderCount: 0,
      };
      eventMap.set(eventKey, ev);
    }
    ev.folderCount += 1;
    ev.photoCount += folder.photoCount;
    if (
      folder.takenAt &&
      (!ev.takenAt || folder.takenAt < ev.takenAt)
    ) {
      ev.takenAt = folder.takenAt;
    }
    if (!ev.date) ev.date = formatMonthYear(ev.takenAt);
  }
  const events = [...eventMap.values()].sort((a, b) => {
    const ta = a.takenAt ? Date.parse(a.takenAt) : 0;
    const tb = b.takenAt ? Date.parse(b.takenAt) : 0;
    if (ta !== tb) return tb - ta;
    return a.slug.localeCompare(b.slug);
  });

  // Private folders — kept out of the public folders/events arrays so nothing
  // renders on /photography/*. Exposed under `privateFolders` so the server
  // can look them up by slug for password-gated rendering.
  const privateFolders = [];
  for (const folder of [...privateFolderMap.values()].sort((a, b) =>
    a.path.localeCompare(b.path)
  )) {
    folder.photos.sort((a, b) =>
      a.originalFilename.localeCompare(b.originalFilename, undefined, {
        numeric: true,
      })
    );
    const leafMeta = metaByDir.get(folder.path) ?? {};
    const eventMeta =
      metaByDir.get(`${folder.category}/${folder.event}`) ?? {};
    const title =
      leafMeta.title ??
      (folder.subPath === ""
        ? (eventMeta.title ?? titleCaseFromSlug(folder.event))
        : titleCaseFromSlug(
            folder.subPath.split("/").slice(-1)[0] ?? folder.event
          ));
    privateFolders.push({
      path: folder.path,
      slug: folder.event,
      category: folder.category,
      event: folder.event,
      name: folder.subPath,
      title,
      photoCount: folder.photos.length,
      cover: folder.photos[0]?.url,
      photos: folder.photos,
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: PUBLIC_URL,
    folders,
    events,
    privateFolders,
    packAssets: packAssets.sort((a, b) =>
      a.originalFilename.localeCompare(b.originalFilename, undefined, {
        numeric: true,
      })
    ),
  };

  if (!DRY_RUN) {
    await writeJson(MANIFEST_OUT, manifest);
    await writeJson(CACHE_FILE, nextCache);
  }

  const plural = (n, s) => `${n} ${s}${n === 1 ? "" : "s"}`;
  console.log(
    `[photos:sync] ${plural(totalPhotos, "photo")} · ${plural(events.length, "event")} · ${plural(folders.length, "folder")}${privateFolders.length ? ` · ${plural(privateFolders.length, "private folder")}` : ""}${packAssets.length ? ` · ${plural(packAssets.length, "pack asset")}` : ""}`
  );
  console.log(
    `[photos:sync] uploaded ${uploadedPhotos}, reused ${skippedUnchanged} from cache${DRY_RUN ? " (dry run — no writes)" : ""}`
  );
  if (!DRY_RUN) {
    console.log(
      `[photos:sync] manifest → ${path.relative(ROOT, MANIFEST_OUT)}`
    );
  }
}

main().catch((err) => {
  if (SOFT_ENV) {
    console.warn(
      `[photos:sync] soft-fail: ${err?.message ?? err}. Continuing with the existing manifest.`
    );
    process.exit(0);
  }
  console.error("[photos:sync] failed:", err);
  process.exit(1);
});
