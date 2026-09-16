// ---------------------------------------------------------------------------
// Signed tokens for private-gallery cookies and paid download links.
//
// Uses JWT (jose). In dev, falls back to a deterministic secret so routes
// still work without env setup. Production MUST set PRIVATE_GALLERY_COOKIE_SECRET.
// ---------------------------------------------------------------------------

import { SignJWT, jwtVerify } from "jose";

const DEV_FALLBACK_SECRET = "dev-only-not-for-production-use-focusedontom";

function getSecretKey(): Uint8Array {
  const raw =
    process.env.PRIVATE_GALLERY_COOKIE_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production" ? DEV_FALLBACK_SECRET : "");
  if (!raw) {
    throw new Error(
      "PRIVATE_GALLERY_COOKIE_SECRET is not set. Generate one with `openssl rand -base64 48`."
    );
  }
  return new TextEncoder().encode(raw);
}

// ---------------------------------------------------------------------------
// Private gallery cookie
// ---------------------------------------------------------------------------

export const PRIVATE_GALLERY_COOKIE_NAME = "foc_private_gallery";

export type PrivateGalleryClaims = {
  /** Gallery slug the cookie authorizes. */
  slug: string;
  /** Gallery id. */
  gid: string;
};

export async function signPrivateGalleryCookie(
  claims: PrivateGalleryClaims,
  maxAgeSec: number
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSec)
    .setSubject(claims.gid)
    .sign(getSecretKey());
}

export async function verifyPrivateGalleryCookie(
  token: string
): Promise<PrivateGalleryClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.slug !== "string" || typeof payload.gid !== "string") {
      return null;
    }
    return { slug: payload.slug, gid: payload.gid };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Paid download tokens
// ---------------------------------------------------------------------------

export type DownloadTokenClaims = {
  /** Photo order id. */
  orderId: string;
  /** Photo id this download references (sanity check). */
  photoId: string;
};

export async function signDownloadToken(
  claims: DownloadTokenClaims,
  maxAgeSec: number
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSec)
    .setSubject(claims.orderId)
    .sign(getSecretKey());
}

export async function verifyDownloadToken(
  token: string
): Promise<DownloadTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.orderId !== "string" || typeof payload.photoId !== "string") {
      return null;
    }
    return { orderId: payload.orderId, photoId: payload.photoId };
  } catch {
    return null;
  }
}
