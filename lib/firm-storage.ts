// Per-firm refreshed data — keyed by slug, lives in localStorage.

import type { FirmRefreshedData } from "./types-firm";

const KEY = "signal-pe:firm-refreshed:v1";

type Map = Record<string, FirmRefreshedData>;

export function loadAllRefreshed(): Map {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Map;
  } catch {
    return {};
  }
}

export function loadRefreshed(slug: string): FirmRefreshedData | null {
  return loadAllRefreshed()[slug] ?? null;
}

export function saveRefreshed(d: FirmRefreshedData): void {
  if (typeof window === "undefined") return;
  const all = loadAllRefreshed();
  all[d.slug] = d;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearRefreshed(slug: string): void {
  if (typeof window === "undefined") return;
  const all = loadAllRefreshed();
  delete all[slug];
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
