// Thesis gallery — saved investment theses live in localStorage.

import type { ThesisDraft } from "./types";

export type SavedThesis = {
  id: string;
  savedAt: string;
  draft: ThesisDraft;
};

const KEY = "signal-pe:theses:v1";

export function loadTheses(): SavedThesis[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedThesis[];
  } catch {
    return [];
  }
}

export function saveThesis(draft: ThesisDraft): SavedThesis {
  const all = loadTheses();
  const entry: SavedThesis = {
    id: draft.id,
    savedAt: new Date().toISOString(),
    draft,
  };
  // Replace in place if id exists.
  const idx = all.findIndex((t) => t.id === draft.id);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  window.localStorage.setItem(KEY, JSON.stringify(all));
  return entry;
}

export function deleteThesis(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadTheses().filter((t) => t.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function thesisToMarkdown(t: ThesisDraft): string {
  return [
    `# Investment Thesis: ${t.target}`,
    ``,
    `*Created ${new Date(t.createdAt).toLocaleDateString()} · Recommendation: **${t.recommendation.toUpperCase()}***`,
    ``,
    `## Industry`,
    t.industry,
    ``,
    `## Market Size`,
    t.marketSize,
    ``,
    `## Business Model`,
    t.businessModel,
    ``,
    `## Financial Snapshot`,
    t.financialSnapshot,
    ``,
    `## Strategic Fit`,
    t.strategicFit,
    ``,
    `## Diligence Questions`,
    ...t.diligenceQuestions.map((q, i) => `${i + 1}. ${q}`),
    ``,
    `## Red Flags`,
    ...t.redFlags.map((r) => `- ${r}`),
    ``,
    `## Rationale`,
    t.rationale,
    ``,
  ].join("\n");
}
