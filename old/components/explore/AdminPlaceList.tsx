"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PLACE_TYPE_LABELS, STATUS_LABELS, type PersonalStatus, type Place, type PlaceType } from "@/lib/explore/types";
import { StatusBadge } from "@/components/explore/StatusBadge";
import { updatePlaceStatus } from "@/app/explore/admin/actions";

export function AdminPlaceList({ places }: { places: Place[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<PlaceType | "all">("all");
  const [status, setStatus] = useState<PersonalStatus | "all">("all");
  const [source, setSource] = useState<"all" | "dec" | "parks" | "seed">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (status !== "all" && p.personalStatus !== status) return false;
      if (source === "dec" && p.officialSourceId !== "nys-dec-backcountry") return false;
      if (source === "parks" && p.officialSourceId !== "nys-parks") return false;
      if (source === "seed" && p.officialSourceId === "nys-dec-backcountry") return false;
      if (q) {
        const hay = `${p.name} ${p.county ?? ""} ${p.region ?? ""} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [places, query, type, status, source]);

  const types = Array.from(new Set(places.map((p) => p.type))).sort();

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places…"
          className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PlaceType | "all")}
          className="rounded-xl border border-white/10 bg-[var(--bg2)] px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {PLACE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PersonalStatus | "all")}
          className="rounded-xl border border-white/10 bg-[var(--bg2)] px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          {(Object.keys(STATUS_LABELS) as PersonalStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as typeof source)}
          className="rounded-xl border border-white/10 bg-[var(--bg2)] px-3 py-2 text-sm"
        >
          <option value="all">All sources</option>
          <option value="dec">NYS DEC</option>
          <option value="parks">NYS Parks</option>
          <option value="seed">Manual / seed</option>
        </select>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {filtered.length} places
      </p>
      <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
        {filtered.slice(0, 200).map((place) => (
          <li
            key={place.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/explore/admin/places/${place.id}`}
                className="font-medium hover:text-[var(--accent-light)]"
              >
                {place.name}
              </Link>
              <p className="text-xs text-[var(--text-muted)]">
                {PLACE_TYPE_LABELS[place.type]}
                {place.officialSource?.name ? ` · ${place.officialSource.name}` : ""}
                {place.isHidden ? " · hidden" : ""}
              </p>
              <div className="mt-2">
                <StatusBadge status={place.personalStatus} />
              </div>
            </div>
            <select
              defaultValue={place.personalStatus}
              onChange={(e) =>
                void updatePlaceStatus(place.id, e.target.value as PersonalStatus)
              }
              className="rounded-lg border border-white/10 bg-[var(--bg2)] px-3 py-2 text-sm"
            >
              {(Object.keys(STATUS_LABELS) as PersonalStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
