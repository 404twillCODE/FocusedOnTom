import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2, getR2Bucket } from "@/lib/r2";

export function assertVaultR2() {
  const client = getR2();
  const bucket = getR2Bucket("private");
  if (!client || !bucket) throw new Error("Vault private R2 bucket is not configured");
  return { client, bucket };
}

export function safeR2Filename(name: string) {
  return (name.trim() || "file")
    .replace(/[^\w.\-() ]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 180);
}

export function makeVaultObjectKey(ownerId: string, fileId: string, filename: string) {
  return `vault/${ownerId}/${fileId}/${safeR2Filename(filename)}`;
}

export async function presignVaultPut({
  key,
  contentType,
  expiresInSeconds = 60 * 10,
}: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const { client, bucket } = assertVaultR2();
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
}

export async function presignVaultGet({
  key,
  filename,
  disposition,
  contentType,
  expiresInSeconds = 60 * 5,
}: {
  key: string;
  filename: string;
  disposition: "inline" | "attachment";
  contentType?: string;
  expiresInSeconds?: number;
}) {
  const { client, bucket } = assertVaultR2();
  await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const safeName = filename.replace(/"/g, "'");
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: contentType,
      ResponseContentDisposition: `${disposition}; filename="${safeName}"`,
    }),
    { expiresIn: expiresInSeconds }
  );
}
