"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GeoJSONSource, Map as MapLibreMap, NavigationControl } from "maplibre-gl";
import type { MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Crosshair,
  Filter,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { filterPlaces, placesToGeoJSON } from "@/lib/explore/geojson";
import { STATUS_COLORS } from "@/lib/explore/constants";
import {
  PLACE_TYPE_LABELS,
  PLACE_TYPES,
  STATUS_LABELS,
  type PersonalStatus,
  type Place,
  type PlaceType,
} from "@/lib/explore/types";
import { StatusBadge } from "./StatusBadge";
import { NY_BOUNDS, NY_CENTER } from "@/lib/explore/types";

const STYLE = "https://tiles.openfreemap.org/styles/dark";

type GeoJSONPlace = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id?: string;
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      id: string;
      slug: string;
      name: string;
      type: PlaceType;
      personalStatus: PersonalStatus;
      county: string;
      region: string;
      coverImage: string;
    };
  }>;
};

function featureToPlace(f: GeoJSONPlace["features"][number]): Place {
  const p = f.properties;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: p.type,
    latitude: f.geometry.coordinates[1],
    longitude: f.geometry.coordinates[0],
    county: p.county || undefined,
    region: p.region || undefined,
    personalStatus: p.personalStatus,
    coverImage: p.coverImage || undefined,
    createdAt: "",
    updatedAt: "",
  };
}

export function ExploreMapClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PersonalStatus | "all">("all");
  const [visitedOnly, setVisitedOnly] = useState(false);
  const [types, setTypes] = useState<PlaceType[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/explore/places/geojson")
      .then((r) => r.json())
      .then((geo: GeoJSONPlace) => {
        if (cancelled || !geo?.features) return;
        setAllPlaces(geo.features.map(featureToPlace));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const places = allPlaces;

  const filtered = useMemo(
    () =>
      filterPlaces(places, {
        status,
        types,
        query,
        visitedOnly,
      }),
    [places, status, types, query, visitedOnly]
  );

  const selected = places.find((p) => p.id === selectedId) ?? null;
  const geojson = useMemo(() => placesToGeoJSON(filtered), [filtered]);

  const applyData = useCallback(() => {
    const map = mapObj.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("places") as GeoJSONSource | undefined;
    if (source) source.setData(geojson);
  }, [geojson]);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const map = new MapLibreMap({
      container: mapRef.current,
      style: STYLE,
      center: NY_CENTER,
      zoom: 6.2,
      maxBounds: [
        [NY_BOUNDS.west - 1.2, NY_BOUNDS.south - 0.8],
        [NY_BOUNDS.east + 1.2, NY_BOUNDS.north + 0.8],
      ],
      attributionControl: { compact: true },
    });
    mapObj.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("places", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 46,
        promoteId: "id",
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": STATUS_COLORS.visited,
          "circle-radius": ["step", ["get", "point_count"], 16, 8, 20, 20, 26],
          "circle-opacity": 0.88,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.2)",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: { "text-color": "#f4f5f7" },
      });

      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
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
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            10,
            7,
          ],
          "circle-stroke-width": [
            "match",
            ["get", "type"],
            "lean_to",
            3,
            "primitive_campsite",
            2,
            2,
          ],
          "circle-stroke-color": [
            "match",
            ["get", "type"],
            "lean_to",
            "rgba(244,245,247,0.9)",
            "rgba(7,17,26,0.85)",
          ],
          "circle-opacity": 0.95,
        },
      });

      map.on("click", "clusters", (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const coords = feature.geometry.coordinates as [number, number];
        const source = map.getSource("places") as GeoJSONSource;
        const clusterId = feature.properties?.cluster_id as number;
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          map.easeTo({ center: coords, zoom });
        });
      });

      map.on("click", "unclustered", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelectedId(id);
      });

      let hoveredId: string | number | null = null;
      map.on("mousemove", "unclustered", (e: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const id = e.features?.[0]?.id;
        if (id == null || id === hoveredId) return;
        if (hoveredId != null) {
          map.setFeatureState({ source: "places", id: hoveredId }, { hover: false });
        }
        hoveredId = id;
        map.setFeatureState({ source: "places", id }, { hover: true });
      });
      map.on("mouseleave", "unclustered", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredId != null) {
          map.setFeatureState({ source: "places", id: hoveredId }, { hover: false });
          hoveredId = null;
        }
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      setReady(true);
    });

    return () => {
      map.remove();
      mapObj.current = null;
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFs = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      mapObj.current?.resize();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (ready) applyData();
  }, [ready, applyData]);

  useEffect(() => {
    const map = mapObj.current;
    if (!map || !selected) return;
    map.easeTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(map.getZoom(), 10.5),
      duration: 700,
    });
  }, [selected]);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapObj.current?.easeTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 10,
          duration: 900,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function toggleFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  function toggleType(type: PlaceType) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  return (
    <div ref={wrapRef} className="relative flex min-h-0 flex-1 bg-[var(--bg)]">
      <div className="relative min-h-[70svh] w-full lg:min-h-0">
        <div ref={mapRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col gap-2 sm:inset-x-4 sm:top-4 lg:max-w-md">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/12 bg-[rgba(7,17,26,0.78)] px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parks, lakes, towers, counties…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[var(--text)]"
              aria-expanded={filtersOpen}
              aria-label="Filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {filtersOpen && (
            <div className="pointer-events-auto max-h-[50svh] overflow-y-auto rounded-2xl border border-white/12 bg-[rgba(7,17,26,0.9)] p-4 shadow-[0_12px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <p className="text-[10px] font-medium tracking-[0.2em] text-[var(--text-muted)]">
                STATUS
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["all", "visited", "want_to_visit", "unvisited"] as const).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setVisitedOnly(false);
                        setStatus(value);
                      }}
                      className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.12em] uppercase ${
                        status === value && !visitedOnly
                          ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--text)]"
                          : "border-white/10 text-[var(--text-muted)]"
                      }`}
                    >
                      {value === "all" ? "All" : STATUS_LABELS[value]}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVisitedOnly(true);
                    setStatus("all");
                  }}
                  className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.12em] uppercase ${
                    visitedOnly
                      ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--text)]"
                      : "border-white/10 text-[var(--text-muted)]"
                  }`}
                >
                  Only visited
                </button>
              </div>

              <p className="mt-4 text-[10px] font-medium tracking-[0.2em] text-[var(--text-muted)]">
                CATEGORIES
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PLACE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] ${
                      types.includes(type)
                        ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--text)]"
                        : "border-white/10 text-[var(--text-muted)]"
                    }`}
                  >
                    {PLACE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              {types.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTypes([])}
                  className="mt-3 text-xs text-[var(--accent-light)]"
                >
                  Clear categories
                </button>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
                <LegendDot color={STATUS_COLORS.visited} label="Visited" />
                <LegendDot color={STATUS_COLORS.want_to_visit} label="Want to visit" />
                <LegendDot color={STATUS_COLORS.unvisited} label="Unvisited" />
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-white/70" />
                  Lean-to
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
                  Campsite / other
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-col gap-2 sm:right-4">
          <button
            type="button"
            onClick={locate}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[rgba(7,17,26,0.78)] text-[var(--text)] backdrop-blur-xl"
            aria-label="Use my location"
          >
            <Crosshair className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[rgba(7,17,26,0.78)] text-[var(--text)] backdrop-blur-xl"
            aria-label="Fullscreen map"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full border border-white/10 bg-[rgba(7,17,26,0.7)] px-3 py-1 text-[10px] tracking-[0.16em] text-[var(--text-muted)] backdrop-blur-md sm:bottom-4 sm:left-4">
          {filtered.length} PLACES
        </p>
      </div>

      <aside className="hidden w-[360px] shrink-0 border-l border-white/10 bg-[var(--bg2)] lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
            EXPLORE NEW YORK
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">
            {selected ? selected.name : "Places"}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {selected ? (
            <PlacePreview
              place={selected}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <ul className="p-2">
              {filtered.slice(0, 40).map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(place.id)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 ${
                        place.type === "lean_to" ? "rounded-[2px]" : "rounded-full"
                      }`}
                      style={{ background: STATUS_COLORS[place.personalStatus] }}
                    />
                    <span>
                      <span className="block text-sm text-[var(--text)]">
                        {place.name}
                      </span>
                      <span className="block text-xs text-[var(--text-muted)]">
                        {PLACE_TYPE_LABELS[place.type]}
                        {place.county ? ` · ${place.county}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-20 lg:hidden">
          <div className="rounded-t-3xl border border-white/10 bg-[rgba(7,17,26,0.94)] pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <PlacePreview
              place={selected}
              onClose={() => setSelectedId(null)}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function PlacePreview({
  place,
  onClose,
  compact,
}: {
  place: Place;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "p-4" : "p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={place.personalStatus} />
          <h3 className="mt-2 text-lg font-semibold leading-tight text-[var(--text)]">
            {place.name}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {PLACE_TYPE_LABELS[place.type]}
            {place.county ? ` · ${place.county} County` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[var(--text-muted)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {place.coverImage && (
        <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl border border-white/10">
          <Image
            src={place.coverImage}
            alt={place.name}
            fill
            className="object-cover"
            sizes="360px"
          />
        </div>
      )}
      {place.description && (
        <p className="mt-3 line-clamp-3 text-sm text-[var(--text-muted)]">
          {place.description}
        </p>
      )}
      {place.lastPersonallyVerified && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Last personally verified: {place.lastPersonallyVerified}
        </p>
      )}
      <Link
        href={`/explore/places/${place.slug}`}
        className="mt-4 inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-2 text-xs font-medium tracking-[0.16em] text-[var(--accent-light)]"
      >
        VIEW PLACE →
      </Link>
    </div>
  );
}
