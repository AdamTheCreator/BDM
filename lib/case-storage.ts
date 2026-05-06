import type { SavedCase } from "./types-case";

const KEY = "signal-pe:cases:v1";

export function loadCases(): SavedCase[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedCase[];
  } catch {
    return [];
  }
}

export function saveCase(c: SavedCase): void {
  if (typeof window === "undefined") return;
  const all = loadCases();
  all.push(c);
  // Cap at 50.
  const trimmed = all.slice(-50);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function deleteCase(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadCases().filter((c) => c.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
