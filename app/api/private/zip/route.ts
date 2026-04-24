import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import {
  GetObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  verifyPrivateGalleryCookie,
} from "@/lib/photography-tokens";
import { getR2, getR2Bucket } from "@/lib/r2";
import { getPrivateBundleBySlug } from "@/lib/photography-private";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a ZIP archive of private-gallery photos back to the client.
 *
 * Modes:
 *   ?mode=favorites    only the client's submitted favorites (originals)
 *   ?mode=all          every photo in the gallery (requires allow_all_zip)
 *   ?mode=final        the final delivery files uploaded by admin
 *
 * Streams directly — no temp file is written to disk.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(PRIVATE_GALLERY_COOKIE_NAME)?.value;
  const claims = token ? await verifyPrivateGalleryCookie(token) : null;
  if (!claims)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );

  const mode = request.nextUrl.searchParams.get("mode") ?? "favorites";

  const r2 = getR2();
  const bucket = getR2Bucket();
  if (!r2 || !bucket) {
    return NextResponse.json(
      { ok: false, error: "r2_not_configured" },
      { status: 501 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data: gallery } = await admin
    .from("private_galleries")
    .select("title, allow_all_zip, slug")
    .eq("id", claims.gid)
    .maybeSingle();
  if (!gallery)
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  if (mode === "all" && !gallery.allow_all_zip) {
    return NextResponse.json(
      { ok: false, error: "all_zip_not_allowed" },
      { status: 403 }
    );
  }

  // Build the file list for each mode ------------------------------------
  const bundle = getPrivateBundleBySlug(claims.slug);
  if (!bundle && mode !== "final") {
    return NextResponse.json({ ok: false, error: "no_photos" }, { status: 404 });
  }

  type Entry = { key: string; name: string };
  let entries: Entry[] = [];

  if (mode === "favorites") {
    const { data: favs } = await admin
      .from("private_favorites")
      .select("photo_path")
      .eq("gallery_id", claims.gid);
    const favPaths = new Set((favs ?? []).map((f) => f.photo_path));
    entries = (bundle?.photos ?? [])
      .filter((p) => p.path && favPaths.has(p.path))
      .map((p) => ({
        // Prefer original (no watermark baked in anyway), jpg extension.
        key: `photography-originals/${(p.path ?? "").replace(/\.webp$/i, ".jpg")}`,
        name: (p.path ?? "").split("/").pop() ?? "photo.jpg",
      }));
  } else if (mode === "all") {
    entries = (bundle?.photos ?? []).map((p) => ({
      key: `photography-originals/${(p.path ?? "").replace(/\.webp$/i, ".jpg")}`,
      name: (p.path ?? "").split("/").pop() ?? "photo.jpg",
    }));
  } else if (mode === "final") {
    const { data: finals } = await admin
      .from("private_gallery_photos")
      .select("photo_path, final_url")
      .eq("gallery_id", claims.gid)
      .eq("is_final", true);
    entries = (finals ?? []).map((f) => ({
      // `photo_path` here is the R2 key directly (admin-controlled).
      key: f.photo_path,
      name: f.photo_path.split("/").pop() ?? "final.jpg",
    }));
  } else {
    return NextResponse.json(
      { ok: false, error: "invalid_mode" },
      { status: 400 }
    );
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "nothing_to_zip" },
      { status: 404 }
    );
  }

  const filename = `${gallery.slug}-${mode}.zip`.replace(/[^a-z0-9_.-]+/gi, "-");

  const archive = archiver("zip", { zlib: { level: 6 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  archive.on("error", (err) => {
    console.error("[api/private/zip] archive error", err);
    pass.destroy(err);
  });

  // Feed each file from R2 into the archive sequentially. `archiver`
  // happily supports readable streams as inputs.
  (async () => {
    try {
      for (const entry of entries) {
        try {
          const res = (await r2.send(
            new GetObjectCommand({ Bucket: bucket, Key: entry.key })
          )) as GetObjectCommandOutput;
          const body = res.Body;
          if (!body) continue;
          // AWS SDK v3 Body is Readable on Node.js runtime.
          archive.append(body as Readable, { name: entry.name });
        } catch (err) {
          console.warn(
            "[api/private/zip] missing key, skipping",
            entry.key,
            err
          );
        }
      }
      await archive.finalize();
    } catch (err) {
      console.error("[api/private/zip] finalize failed", err);
      pass.destroy(err as Error);
    }
  })();

  const webStream = Readable.toWeb(pass) as unknown as ReadableStream<Uint8Array>;
  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
