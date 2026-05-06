"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Download, Frame, Heart, Loader2, ShoppingBag } from "lucide-react";
import {
  LICENSE_TIERS,
  formatCents,
} from "@/lib/photography-config";
import {
  useFavoritePhotos,
  useLikedPhotos,
  type PhotoEntitlements,
} from "@/lib/photography-likes";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { trackEvent } from "@/lib/photography-analytics";
import type { Photo } from "@/lib/photography";
import {
  buildPhotographyBuyRedirectUrl,
  buildTeVisualsPortfolioPhotoUrl,
  buildTeVisualsPortfolioPhotoViewUrl,
  getTeVisualsPublicUrlRaw,
  isClientTeVisualsPhotographySource,
} from "@/lib/tevisuals-public-shop-url";
import { BuyPhotoDialog } from "./BuyPhotoDialog";

const DOWNLOAD_ORIGINAL_TIMEOUT_MS = 45_000;

const commerceTevisualsClient = isClientTeVisualsPhotographySource();

/**
 * Compact action row rendered under the lightbox image: Like, Favorite, Buy.
 * Kept intentionally low-chrome — icon buttons + a pill CTA.
 */
export function PhotoActions({
  photo,
  entitlements,
}: {
  photo: Photo;
  entitlements: PhotoEntitlements;
}) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { isLiked, toggleLike } = useLikedPhotos();
  const { isFavorite, toggleFavorite } = useFavoritePhotos();

  const photoId = photo.id ?? photo.src;
  const liked = isLiked(photoId);
  const fav = isFavorite(photoId);
  const canDownloadOriginal = Boolean(
    photo.id &&
      entitlements.hasOriginal &&
      (entitlements.unlimitedActive || entitlements.ownsPhoto)
  );
  const personalCents =
    typeof photo.personalPriceCents === "number"
      ? photo.personalPriceCents
      : (LICENSE_TIERS.find((t) => t.id === "personal")?.priceCents ?? 500);
  const commercialCents =
    typeof photo.commercialPriceCents === "number"
      ? photo.commercialPriceCents
      : (LICENSE_TIERS.find((t) => t.id === "commercial")?.priceCents ?? 5000);
  const buyFromLabel = formatCents(personalCents);

  const commerceEligible =
    Boolean(photo.id?.trim()) && photo.is_for_sale !== false;

  const tePortfolioBuyHref = commerceEligible
    ? (() => {
        const raw = buildTeVisualsPortfolioPhotoUrl(photo, {
          buyPersonal: true,
        });
        return raw ? buildPhotographyBuyRedirectUrl(raw) : null;
      })()
    : null;
  const tePortfolioCommercialHref = commerceEligible
    ? (() => {
        const raw = buildTeVisualsPortfolioPhotoUrl(photo, {
          buyCommercial: true,
        });
        return raw ? buildPhotographyBuyRedirectUrl(raw) : null;
      })()
    : null;
  const tePortfolioDownloadHref = photo.id?.trim()
    ? (() => {
        const raw = buildTeVisualsPortfolioPhotoViewUrl(photo);
        return raw ? buildPhotographyBuyRedirectUrl(raw) : null;
      })()
    : null;

  async function downloadOriginal() {
    if (!photo.id || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    const tag = `[download-original] photoId=${photo.id}`;
    console.info(`${tag} start`);
    try {
      const supabase = getFOYSupabase();
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) throw new Error("Sign in again to download.");

      type DlRace =
        | { kind: "res"; res: Response }
        | { kind: "timeout" };
      const dlRaced = await Promise.race<DlRace>([
        fetch(`/api/photo/original/${photo.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => ({ kind: "res" as const, res })),
        new Promise<DlRace>((resolve) =>
          setTimeout(() => {
            console.warn(`${tag} timeout ${DOWNLOAD_ORIGINAL_TIMEOUT_MS}ms`);
            resolve({ kind: "timeout" });
          }, DOWNLOAD_ORIGINAL_TIMEOUT_MS)
        ),
      ]);

      if (dlRaced.kind === "timeout") {
        throw new Error("Download timed out — try again.");
      }

      const res = dlRaced.res;
      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        /* non-JSON */
      }
      console.info(`${tag} end`, { ok: res.ok, status: res.status });
      if (!res.ok || !data.url) {
        throw new Error(
          data.error ?? (raw.slice(0, 120) || "Download unavailable")
        );
      }
      trackEvent("photo_original_download", { photo_id: photo.id });
      window.location.href = data.url;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Download unavailable";
      console.warn(`${tag} error`, err);
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="relative flex w-full flex-col gap-3">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={liked ? "Unlike photo" : "Like photo"}
            aria-pressed={liked}
            onClick={(e) => {
              e.stopPropagation();
              void toggleLike(photoId);
              trackEvent("photo_like", {
                photo_id: photoId,
                action: liked ? "unlike" : "like",
              });
            }}
            className={`group inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
              liked
                ? "border-rose-400/60 bg-rose-500/15 text-rose-200"
                : "border-white/10 bg-white/[0.06] text-white/80 hover:border-white/25"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
              strokeWidth={2}
            />
            <span>{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            aria-label={fav ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={fav}
            onClick={(e) => {
              e.stopPropagation();
              void toggleFavorite(photoId, photo.path);
              trackEvent("photo_favorite", {
                photo_id: photoId,
                action: fav ? "remove" : "add",
              });
            }}
            className={`group inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
              fav
                ? "border-[var(--ice)]/60 bg-[var(--ice)]/15 text-[var(--ice)]"
                : "border-white/10 bg-white/[0.06] text-white/80 hover:border-white/25"
            }`}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`}
              strokeWidth={2}
            />
            <span>{fav ? "Saved" : "Save"}</span>
          </button>
        </div>

        {commerceTevisualsClient && commerceEligible ? (
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {photo.id && (
                <Link
                  href={`/photography/print/${photo.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("print_click", { photo_id: photoId });
                  }}
                  className="hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-white/80 transition-colors hover:border-white/25 sm:inline-flex"
                >
                  <Frame className="h-3.5 w-3.5" />
                  <span>Print</span>
                </Link>
              )}
              {tePortfolioBuyHref ? (
                <Link
                  href={tePortfolioBuyHref}
                  prefetch={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("buy_click", { photo_id: photoId });
                  }}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/10 px-4 text-xs font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{`Buy on TE Visuals · ${buyFromLabel}`}</span>
                </Link>
              ) : (
                <span className="text-xs text-amber-200/90">
                  {!getTeVisualsPublicUrlRaw()
                    ? "Buy unavailable — set NEXT_PUBLIC_TEVISUALS_PUBLIC_URL in .env.local, then restart."
                    : "Buy link unavailable."}
                </span>
              )}
              {tePortfolioCommercialHref ? (
                <Link
                  href={tePortfolioCommercialHref}
                  prefetch={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("buy_click", {
                      photo_id: photoId,
                      license: "commercial",
                    });
                  }}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 text-xs font-medium text-white/85 transition-colors hover:border-white/30"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{`Commercial License · ${formatCents(commercialCents)}`}</span>
                </Link>
              ) : null}
              {tePortfolioDownloadHref ? (
                <Link
                  href={tePortfolioDownloadHref}
                  prefetch={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("tevisuals_photo_download_nav", {
                      photo_id: photoId,
                    });
                  }}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-xs font-medium text-white/80 transition-colors hover:border-white/25"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download on TE Visuals</span>
                </Link>
              ) : null}
            </div>
          </div>
        ) : commerceTevisualsClient ? (
          <div className="flex items-center gap-2">
            {photo.id && (
              <Link
                href={`/photography/print/${photo.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  trackEvent("print_click", { photo_id: photoId });
                }}
                className="hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-white/80 transition-colors hover:border-white/25 sm:inline-flex"
              >
                <Frame className="h-3.5 w-3.5" />
                <span>Print</span>
              </Link>
            )}
          </div>
        ) : !commerceTevisualsClient ? (
          <div className="flex items-center gap-2">
            {photo.id && (
              <Link
                href={`/photography/print/${photo.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  trackEvent("print_click", { photo_id: photoId });
                }}
                className="hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-white/80 transition-colors hover:border-white/25 sm:inline-flex"
              >
                <Frame className="h-3.5 w-3.5" />
                <span>Print</span>
              </Link>
            )}
            {canDownloadOriginal ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void downloadOriginal();
                }}
                disabled={downloading}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/10 px-4 text-xs font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20 disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>
                  {entitlements.unlimitedActive && !entitlements.ownsPhoto
                    ? "Download original"
                    : entitlements.ownsPhoto
                      ? "Owned · Download"
                      : "Download original"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBuyOpen(true);
                  trackEvent("buy_click", { photo_id: photoId });
                }}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/10 px-4 text-xs font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{`Buy · from ${buyFromLabel}`}</span>
              </button>
            )}
          </div>
        ) : null}
      </div>

      {downloadError ? (
        <p className="text-xs text-rose-300">{downloadError}</p>
      ) : null}

      {!commerceTevisualsClient ? (
        <BuyPhotoDialog
          photo={photo}
          open={buyOpen}
          onClose={() => setBuyOpen(false)}
        />
      ) : null}
    </div>
  );
}
