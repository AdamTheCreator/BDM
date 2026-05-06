import type { SavedInterview } from "./types-interview";

const KEY = "signal-pe:interviews:v1";

export function loadInterviews(): SavedInterview[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedInterview[];
  } catch {
    return [];
  }
}

export function saveInterview(s: SavedInterview): void {
  if (typeof window === "undefined") return;
  const all = loadInterviews();
  all.push(s);
  // Cap at 50 to bound localStorage.
  const trimmed = all.slice(-50);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function deleteInterview(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadInterviews().filter((s) => s.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
