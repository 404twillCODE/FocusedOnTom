"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { PhotographyMap } from "./PhotographyMap";

const MapView = dynamic(
  () =>
    import("./PhotographyMap").then((m) => ({
      default: m.PhotographyMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] w-full animate-pulse bg-[var(--bg3)]/60" />
    ),
  }
);

export function PhotographyMapLoader(
  props: ComponentProps<typeof PhotographyMap>
) {
  return <MapView {...props} />;
}
