"use client";

import type { Photo } from "@/lib/photography";

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
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { isClientTeVisualsPhotographySource } from "@/lib/tevisuals-public-shop-url";

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
      const supabase = getFOYSupabase();
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
        const supabase = getFOYSupabase();
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

/** Entitlement snapshot for lightbox commerce (non-blocking defaults). */
export type PhotoEntitlements = {
  /** Request finished normally, timed out, or failed (steady-state for watermark). */
  ready: boolean;
  signedIn: boolean;
  unlimitedActive: boolean;
  personalDownload: boolean;
  commercialDownload: boolean;
  ownsPhoto: boolean;
  isUnlimited: boolean;
  hasOriginal: boolean;
};

const ENTITLEMENT_TIMEOUT_MS = 12_000;

function fallbackEntitlements(hasOriginal: boolean): PhotoEntitlements {
  return {
    ready: true,
    signedIn: false,
    unlimitedActive: false,
    personalDownload: false,
    commercialDownload: false,
    ownsPhoto: false,
    isUnlimited: false,
    hasOriginal,
  };
}

/** True unless the manifest explicitly opts out (future-proof). */
export function photoHasOriginalHeader(photo: Photo | undefined): boolean {
  if (!photo) return true;
  const o = (photo as { noOriginal?: boolean }).noOriginal;
  return o !== true;
}

/**
 * Whether the current user has Unlimited and/or owns this photo. Used for
 * watermark + download — never blocks Buy CTAs: on slow/failed fetch we fall
 * back to safe defaults and keep Buy visible.
 *
 * Does **not** abort the fetch on React effect cleanup (avoids Strict Mode /
 * sibling unmount aborting a shared request). Timeout uses `Promise.race` only
 * — no `AbortController` (avoids browser “signal is aborted without reason”).
 */
export function useUnlimitedAndOwnership(
  photoId: string | undefined,
  options?: { enabled?: boolean; photo?: Photo }
): PhotoEntitlements {
  const { enabled = true, photo } = options ?? {};
  const hasOriginal = photoHasOriginalHeader(photo);

  const [state, setState] = useState<PhotoEntitlements>(() => ({
    ready: false,
    signedIn: false,
    unlimitedActive: false,
    personalDownload: false,
    commercialDownload: false,
    ownsPhoto: false,
    isUnlimited: false,
    hasOriginal,
  }));

  /** Bump after returning from Stripe / another tab — legacy FOT commerce only. */
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled || isClientTeVisualsPhotographySource()) return;
    let last = document.visibilityState;
    const onVisibility = () => {
      const cur = document.visibilityState;
      if (last === "hidden" && cur === "visible") {
        setRefreshKey((k) => k + 1);
      }
      last = cur;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  /** Stripe return URL may include ?photo=<id> — refetch entitlement for that photo. */
  useEffect(() => {
    if (
      !enabled ||
      !photoId ||
      typeof window === "undefined" ||
      isClientTeVisualsPhotographySource()
    )
      return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("photo") === photoId) {
        console.info(`[entitlements] URL ?photo= matches open photo — refetch`);
        setRefreshKey((k) => k + 1);
      }
    } catch {
      /* ignore */
    }
  }, [enabled, photoId]);

  /** Second fetch ~1s after open — legacy FOT commerce only. */
  useEffect(() => {
    if (
      !enabled ||
      !photoId ||
      typeof window === "undefined" ||
      isClientTeVisualsPhotographySource()
    )
      return;
    const id = window.setTimeout(() => {
      setRefreshKey((k) => k + 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [enabled, photoId]);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setState({
        ready: false,
        signedIn: false,
        unlimitedActive: false,
        personalDownload: false,
        commercialDownload: false,
        ownsPhoto: false,
        isUnlimited: false,
        hasOriginal,
      });
      return;
    }

    if (isClientTeVisualsPhotographySource()) {
      if (!cancelled) {
        setState(fallbackEntitlements(hasOriginal));
      }
      return () => {
        cancelled = true;
      };
    }

    setState((prev) => ({
      ...prev,
      ready: false,
      hasOriginal,
    }));

    const startedAt = Date.now();
    const tag = `[entitlements] photoId=${photoId ?? "none"}`;

    async function run() {
      try {
        const supabase = getFOYSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const sessionEmail = sessionData.session?.user?.email?.trim();

        if (!token) {
          if (!cancelled) {
            console.info(`${tag} fetch end`, {
              ms: Date.now() - startedAt,
              reason: "no_session",
            });
            setState({
              ready: true,
              signedIn: false,
              unlimitedActive: false,
              personalDownload: false,
              commercialDownload: false,
              ownsPhoto: false,
              isUnlimited: false,
              hasOriginal,
            });
          }
          return;
        }

        const fetchHeaders: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };
        const entitlementUrl = photoId
          ? `/api/photo/entitlements?photo_id=${encodeURIComponent(photoId)}`
          : `/api/photo/entitlements`;

        console.info(`${tag} fetch start`, {
          emailVia: sessionEmail ? "session" : "none",
        });

        type Race =
          | { outcome: "response"; res: Response }
          | { outcome: "timeout" }
          | { outcome: "fetch_err"; err: unknown };

        const raced = await Promise.race<Race>([
          fetch(entitlementUrl, {
            headers: fetchHeaders,
          })
            .then((res) => ({ outcome: "response" as const, res }))
            .catch((err: unknown) => ({
              outcome: "fetch_err" as const,
              err,
            })),
          new Promise<Race>((resolve) =>
            setTimeout(() => {
              console.warn(`${tag} timeout after ${ENTITLEMENT_TIMEOUT_MS}ms`);
              resolve({ outcome: "timeout" });
            }, ENTITLEMENT_TIMEOUT_MS)
          ),
        ]);

        if (raced.outcome === "timeout") {
          if (!cancelled) {
            setState({
              ...fallbackEntitlements(hasOriginal),
              signedIn: Boolean(token),
            });
          }
          return;
        }

        if (raced.outcome === "fetch_err") {
          const err = raced.err;
          console.warn(`${tag} fetch error`, {
            ms: Date.now() - startedAt,
            message: err instanceof Error ? err.message : String(err),
          });
          if (!cancelled) {
            setState({
              ...fallbackEntitlements(hasOriginal),
              signedIn: Boolean(token),
            });
          }
          return;
        }

        const res = raced.res;

        if (!res.ok) {
          console.warn(`${tag} fetch non-OK`, {
            ms: Date.now() - startedAt,
            status: res.status,
          });
          if (!cancelled) {
            setState({
              ...fallbackEntitlements(hasOriginal),
              signedIn: Boolean(token),
            });
          }
          return;
        }

        const data = (await res.json()) as {
          unlimited?: boolean;
          owns?: boolean;
        };
        const owns = Boolean(data.owns);
        const unlimited = Boolean(data.unlimited);

        if (!cancelled) {
          console.info(`${tag} fetch end`, {
            ms: Date.now() - startedAt,
            response: { owns, unlimited },
          });
          setState({
            ready: true,
            signedIn: Boolean(token),
            unlimitedActive: unlimited,
            personalDownload: owns,
            commercialDownload: owns,
            ownsPhoto: owns,
            isUnlimited: unlimited,
            hasOriginal,
          });
        }
      } catch (err) {
        console.warn(`${tag} unexpected`, err);
        if (!cancelled) {
          setState({
            ...fallbackEntitlements(hasOriginal),
            signedIn: false,
          });
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [photoId, enabled, hasOriginal, refreshKey]);

  return state;
}
