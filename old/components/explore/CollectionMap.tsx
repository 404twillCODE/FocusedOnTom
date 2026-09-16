"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { placesToGeoJSON } from "@/lib/explore/geojson";
import { STATUS_COLORS } from "@/lib/explore/constants";
import type { Place } from "@/lib/explore/types";

export function CollectionMap({ places }: { places: Place[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || places.length === 0) return;
    const map = new MapLibreMap({
      container: ref.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [places[0].longitude, places[0].latitude],
      zoom: 6,
      attributionControl: { compact: true },
    });
    map.on("load", () => {
      map.addSource("places", {
        type: "geojson",
        data: placesToGeoJSON(places),
      });
      map.addLayer({
        id: "places",
        type: "circle",
        source: "places",
        paint: {
          "circle-color": [
            "match",
            ["get", "personalStatus"],
            "visited",
            STATUS_COLORS.visited,
            "want_to_visit",
            STATUS_COLORS.want_to_visit,
            STATUS_COLORS.unvisited,
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#07111a",
        },
      });
      const bounds = new LngLatBounds();
      places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 9 });
    });
    return () => map.remove();
  }, [places]);

  return <div ref={ref} className="h-full min-h-[320px] w-full" />;
}
