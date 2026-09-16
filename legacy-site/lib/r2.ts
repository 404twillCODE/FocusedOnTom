// ---------------------------------------------------------------------------
// Small Cloudflare R2 helper — presigned URLs for paid downloads and private
// gallery ZIP streaming.
//
// Uses @aws-sdk/client-s3 (already a dev dependency via the sync script).
// ---------------------------------------------------------------------------

import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cached: S3Client | null | undefined;

export function getR2(): S3Client | null {
  if (cached !== undefined) return cached;
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    cached = null;
    return cached;
  }
  cached = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

export function getR2Bucket(kind: "public" | "private" | "legacy" = "legacy"): string | null {
  const v =
    kind === "private"
      ? process.env.CLOUDFLARE_R2_PRIVATE_BUCKET?.trim()
      : kind === "public"
        ? (process.env.CLOUDFLARE_R2_PUBLIC_BUCKET?.trim() ||
          process.env.CLOUDFLARE_R2_BUCKET?.trim())
        : (process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
          process.env.CLOUDFLARE_R2_PUBLIC_BUCKET?.trim());
  return v && v.length > 0 ? v : null;
}

/**
 * Return a presigned GET URL for the given object key. Returns null when
 * R2 is not configured or the object does not exist.
 */
export async function presignR2Get(
  key: string,
  expiresInSeconds = 60 * 15
): Promise<string | null> {
  return presignR2GetFromBucket(key, "legacy", expiresInSeconds);
}

export async function presignR2GetFromBucket(
  key: string,
  bucketKind: "public" | "private" | "legacy" = "legacy",
  expiresInSeconds = 60 * 5,
  filename?: string
): Promise<string | null> {
  const client = getR2();
  const bucket = getR2Bucket(bucketKind);
  if (!client || !bucket) return null;
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    return null;
  }
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(filename
      ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "'")}"` }
      : {}),
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function r2ObjectExists(
  key: string,
  bucketKind: "public" | "private" | "legacy" = "legacy"
): Promise<boolean> {
  const client = getR2();
  const bucket = getR2Bucket(bucketKind);
  if (!client || !bucket) return false;
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
