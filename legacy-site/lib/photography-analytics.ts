"use client";

// ---------------------------------------------------------------------------
// Lightweight client-side analytics helper.
//
// Prefers Plausible if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. Otherwise POSTs
// to /api/analytics/event, which writes a row into photo_analytics_events.
// ---------------------------------------------------------------------------

import type { AnalyticsEventName } from "./photography-types";

const ANON_ID_KEY = "focusedontom:anon_id";

function getAnonId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = `anon_${crypto.randomUUID()}`;
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon_unknown";
  }
}

type PlausibleFn = (
  name: string,
  opts?: { props?: Record<string, string | number | boolean> }
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

function hasPlausible(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.plausible === "function" &&
    typeof process !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN)
  );
}

/**
 * Track a photography analytics event. Safe to call anywhere on the client —
 * no-ops on the server and never throws. Fire-and-forget.
 */
export function trackEvent(
  name: AnalyticsEventName | string,
  props: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  // Prefer Plausible when available — zero server roundtrip.
  if (hasPlausible()) {
    try {
      const clean: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          clean[k] = v;
        }
      }
      window.plausible?.(String(name), { props: clean });
    } catch {
      // ignore
    }
    return;
  }

  // Fallback: write through our own endpoint.
  try {
    const body = JSON.stringify({
      name: String(name),
      props,
      anon_id: getAnonId(),
      path: window.location.pathname,
    });
    // Use sendBeacon when possible so we don't block navigation.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/event", blob);
      return;
    }
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // analytics must never break the UI
    });
  } catch {
    // ignore
  }
}
