// Tiny localStorage <-> KV adapter — see spec §3.1.
// v1: localStorage only (single-user, browser-side).
// To swap in Vercel KV later, re-implement get/set/del to call /api/kv.

import type { LessonProgress } from "./types";

const PROGRESS_KEY = "signal-pe:lesson-progress:v1";

type ProgressMap = Record<string, LessonProgress>;

export function loadAllProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

export function saveProgress(p: LessonProgress): void {
  if (typeof window === "undefined") return;
  const all = loadAllProgress();
  all[p.lessonSlug] = p;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

export function getProgress(lessonSlug: string): LessonProgress | null {
  const all = loadAllProgress();
  return all[lessonSlug] ?? null;
}
