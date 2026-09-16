"use client";

import dynamic from "next/dynamic";

const fallback = (
  <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-[var(--bg2)] text-xs tracking-[0.16em] text-[var(--text-muted)]">
    LOADING MAP
  </div>
);

export const ExploreMapClient = dynamic(
  () =>
    import("./ExploreMapClient").then((m) => m.ExploreMapClient),
  { ssr: false, loading: () => fallback }
);

export const PlaceMiniMap = dynamic(
  () => import("./PlaceMiniMap").then((m) => m.PlaceMiniMap),
  { ssr: false, loading: () => fallback }
);

export const TripRouteMap = dynamic(
  () => import("./TripRouteMap").then((m) => m.TripRouteMap),
  { ssr: false, loading: () => fallback }
);

export const CollectionMap = dynamic(
  () => import("./CollectionMap").then((m) => m.CollectionMap),
  { ssr: false, loading: () => fallback }
);
