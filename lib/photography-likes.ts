"use client";

// ---------------------------------------------------------------------------
// Client-side hook for likes + favorites.
//
// Anonymous visitors: local-only (localStorage). Their likes still count on
// the server because the API accepts an anon_id from the request body.
// Signed-in users: server-backed, syncs with photo_likes / photo_favorites.
//
// Kept intentionally light: zero external state libraries.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/client";

const LIKES_KEY = "focusedontom:liked_photos";
const FAVORITES_KEY = "focusedontom:favorite_photos";
const EVENT = "focusedontom:liked-favorites-update";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // quota or disabled — nothing we can do, just ignore
  }
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getAnonId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const key = "focusedontom:anon_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `anon_${crypto.randomUUID()}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anon_unknown";
  }
}

export function useLikedPhotos(): {
  liked: Set<string>;
  toggleLike: (photoId: string) => Promise<void>;
  isLiked: (photoId: string) => boolean;
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      // Snapshot must be a stable reference between reads when unchanged.
      // We key a module-level cache by JSON string of the set.
      return cachedLikedSnapshot();
    },
    () => "[]"
  );

  const liked = parseCached(snapshot);

  const toggleLike = useCallback(async (photoId: string) => {
    const current = readSet(LIKES_KEY);
    const next = new Set(current);
    const wasLiked = next.has(photoId);
    if (wasLiked) next.delete(photoId);
    else next.add(photoId);
    writeSet(LIKES_KEY, next);

    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      await fetch("/api/photo/like", {
        method: wasLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ photo_id: photoId, anon_id: getAnonId() }),
      });
    } catch {
      // ignore — client-side state already updated
    }
  }, []);

  const isLiked = useCallback((photoId: string) => liked.has(photoId), [liked]);

  return { liked, toggleLike, isLiked };
}

export function useFavoritePhotos(): {
  favorites: Set<string>;
  toggleFavorite: (photoId: string, photoPath?: string) => Promise<void>;
  isFavorite: (photoId: string) => boolean;
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => cachedFavoritesSnapshot(),
    () => "[]"
  );

  const favorites = parseCached(snapshot);

  const toggleFavorite = useCallback(
    async (photoId: string, photoPath?: string) => {
      const current = readSet(FAVORITES_KEY);
      const next = new Set(current);
      const wasFav = next.has(photoId);
      if (wasFav) next.delete(photoId);
      else next.add(photoId);
      writeSet(FAVORITES_KEY, next);

      try {
        const { data: auth } = await supabase.auth.getSession();
        const token = auth.session?.access_token;
        if (!token) return; // favorites require auth to persist server-side
        await fetch("/api/photo/favorite", {
          method: wasFav ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ photo_id: photoId, photo_path: photoPath }),
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const isFavorite = useCallback(
    (photoId: string) => favorites.has(photoId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}

// ---------------------------------------------------------------------------
// Snapshot caches so useSyncExternalStore returns stable strings.
// ---------------------------------------------------------------------------

let lastLikedString = "[]";
let lastFavoritesString = "[]";

function cachedLikedSnapshot(): string {
  const current = JSON.stringify([...readSet(LIKES_KEY)].sort());
  if (current !== lastLikedString) lastLikedString = current;
  return lastLikedString;
}

function cachedFavoritesSnapshot(): string {
  const current = JSON.stringify([...readSet(FAVORITES_KEY)].sort());
  if (current !== lastFavoritesString) lastFavoritesString = current;
  return lastFavoritesString;
}

function parseCached(str: string): Set<string> {
  try {
    const arr = JSON.parse(str);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

/**
 * Hook that tells the Lightbox whether the current user is an Unlimited
 * subscriber or owns a specific photo (so the watermark can hide).
 * Returns `{ ready, isUnlimited, ownsPhoto }`.
 */
export function useUnlimitedAndOwnership(photoId?: string): {
  ready: boolean;
  isUnlimited: boolean;
  ownsPhoto: boolean;
} {
  const [state, setState] = useState({
    ready: false,
    isUnlimited: false,
    ownsPhoto: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const { data: auth } = await supabase.auth.getSession();
        const token = auth.session?.access_token;
        if (!token) {
          if (!cancelled)
            setState({ ready: true, isUnlimited: false, ownsPhoto: false });
          return;
        }
        const url = photoId
          ? `/api/photo/entitlements?photo_id=${encodeURIComponent(photoId)}`
          : `/api/photo/entitlements`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          unlimited?: boolean;
          owns?: boolean;
        };
        if (cancelled) return;
        setState({
          ready: true,
          isUnlimited: Boolean(data.unlimited),
          ownsPhoto: Boolean(data.owns),
        });
      } catch {
        if (!cancelled)
          setState({ ready: true, isUnlimited: false, ownsPhoto: false });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  return state;
}
