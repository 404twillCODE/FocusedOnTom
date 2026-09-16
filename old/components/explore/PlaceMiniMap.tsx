"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STATUS_COLORS } from "@/lib/explore/constants";
import type { PersonalStatus } from "@/lib/explore/types";

export function PlaceMiniMap({
  latitude,
  longitude,
  status,
}: {
  latitude: number;
  longitude: number;
  status: PersonalStatus;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new MapLibreMap({
      container: ref.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [longitude, latitude],
      zoom: 11,
      interactive: false,
      attributionControl: false,
    });
    map.on("load", () => {
      map.addSource("p", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Point", coordinates: [longitude, latitude] },
          properties: {},
        },
      });
      map.addLayer({
        id: "p",
        type: "circle",
        source: "p",
        paint: {
          "circle-color": STATUS_COLORS[status],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(7,17,26,0.9)",
        },
      });
    });
    return () => map.remove();
  }, [latitude, longitude, status]);

  return (
    <div className="min-h-[240px] overflow-hidden rounded-2xl border border-white/10">
      <div ref={ref} className="h-full min-h-[240px] w-full" />
    </div>
  );
}
