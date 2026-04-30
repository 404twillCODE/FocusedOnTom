"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Download, Frame, Heart, Loader2, ShoppingBag } from "lucide-react";
import {
  useFavoritePhotos,
  useLikedPhotos,
  useUnlimitedAndOwnership,
} from "@/lib/photography-likes";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { trackEvent } from "@/lib/photography-analytics";
import type { Photo } from "@/lib/photography";
import { BuyPhotoDialog } from "./BuyPhotoDialog";

/**
 * Compact action row rendered under the lightbox image: Like, Favorite, Buy.
 * Kept intentionally low-chrome — icon buttons + a pill CTA.
 */
export function PhotoActions({ photo }: { photo: Photo }) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { isLiked, toggleLike } = useLikedPhotos();
  const { isFavorite, toggleFavorite } = useFavoritePhotos();

  const photoId = photo.id ?? photo.src;
  const liked = isLiked(photoId);
  const fav = isFavorite(photoId);
  const entitlements = useUnlimitedAndOwnership(photo.id);
  const canDownloadOriginal = Boolean(photo.id && (entitlements.isUnlimited || entitlements.ownsPhoto));

  async function downloadOriginal() {
    if (!photo.id || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const supabase = getFOYSupabase();
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) throw new Error("Sign in again to download.");
      const res = await fetch(`/api/photo/original/${photo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Download unavailable");
      trackEvent("photo_original_download", { photo_id: photo.id });
      window.location.href = data.url;
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download unavailable");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex w-full items-center justify-between gap-3">
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
            <span>Download original</span>
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
            <span>Buy · from $5</span>
          </button>
        )}
      </div>

      {downloadError ? (
        <p className="absolute bottom-[-1.75rem] right-0 text-xs text-rose-300">
          {downloadError}
        </p>
      ) : null}

      <BuyPhotoDialog
        photo={photo}
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
      />
    </div>
  );
}
