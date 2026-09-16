"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { PersonalStatus } from "./types";

const KEY = "fot-explore-status";
const EVENT = "fot-explore-status";

type StatusMap = Record<string, PersonalStatus>;

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

function write(map: StatusMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function usePlaceStatus(seed: Record<string, PersonalStatus>) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "{}");
  const overrides = useMemo(() => {
    try {
      return JSON.parse(raw) as StatusMap;
    } catch {
      return {} as StatusMap;
    }
  }, [raw]);

  function statusFor(id: string): PersonalStatus {
    return overrides[id] ?? seed[id] ?? "unvisited";
  }

  function setStatus(id: string, status: PersonalStatus) {
    write({ ...overrides, [id]: status });
  }

  return { statusFor, setStatus, ready: true, overrides };
}

export function seedStatusMap(
  places: { id: string; personalStatus: PersonalStatus }[]
): Record<string, PersonalStatus> {
  return Object.fromEntries(places.map((p) => [p.id, p.personalStatus]));
}
