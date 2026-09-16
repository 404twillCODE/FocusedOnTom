"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STATUS_COLORS } from "@/lib/explore/constants";

type Stop = {
  order: number;
  name: string;
  latitude: number;
  longitude: number;
};

export function TripRouteMap({ stops }: { stops: Stop[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || stops.length === 0) return;
    const map = new MapLibreMap({
      container: ref.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [stops[0].longitude, stops[0].latitude],
      zoom: 8,
      attributionControl: { compact: true },
    });

    map.on("load", () => {
      const line = {
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: stops.map((s) => [s.longitude, s.latitude]),
        },
        properties: {},
      };
      const points = {
        type: "FeatureCollection" as const,
        features: stops.map((s) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [s.longitude, s.latitude],
          },
          properties: { order: String(s.order) },
        })),
      };
      map.addSource("route", { type: "geojson", data: line });
      map.addSource("stops", { type: "geojson", data: points });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: {
          "line-color": STATUS_COLORS.visited,
          "line-width": 3,
          "line-opacity": 0.8,
        },
      });
      map.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-color": STATUS_COLORS.visited,
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#07111a",
        },
      });
      map.addLayer({
        id: "stop-labels",
        type: "symbol",
        source: "stops",
        layout: { "text-field": ["get", "order"], "text-size": 11 },
        paint: { "text-color": "#f4f5f7" },
      });
      const bounds = new LngLatBounds();
      stops.forEach((s) => bounds.extend([s.longitude, s.latitude]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 10 });
    });

    return () => map.remove();
  }, [stops]);

  return <div ref={ref} className="h-full min-h-[360px] w-full" />;
}
