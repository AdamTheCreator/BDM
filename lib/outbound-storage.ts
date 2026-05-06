// Saved outbound sequences live in localStorage, same pattern as theses.

import type { OutboundSequence } from "./types-outbound";

const KEY = "signal-pe:sequences:v1";

export function loadSequences(): OutboundSequence[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OutboundSequence[];
  } catch {
    return [];
  }
}

export function saveSequence(seq: OutboundSequence): void {
  if (typeof window === "undefined") return;
  const all = loadSequences();
  const idx = all.findIndex((s) => s.id === seq.id);
  if (idx >= 0) all[idx] = seq;
  else all.push(seq);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteSequence(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadSequences().filter((s) => s.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function sequenceToMarkdown(s: OutboundSequence): string {
  const sections: string[] = [];
  sections.push(`# Outbound Sequence — ${s.company}`);
  sections.push(
    `*Persona: ${s.persona} · Angle: ${s.angle} · Created ${new Date(s.createdAt).toLocaleDateString()}*`,
  );
  if (s.thesisOneLiner) sections.push(`**Thesis:** ${s.thesisOneLiner}`);
  sections.push(`## Day 0 — Initial email\n**Subject:** ${s.initialEmail.subject}\n\n${s.initialEmail.body}`);
  sections.push(`## Day 3 — Nudge\n**Subject:** ${s.day3Nudge.subject}\n\n${s.day3Nudge.body}`);
  sections.push(`## Day 10 — Break-up\n**Subject:** ${s.day10Breakup.subject}\n\n${s.day10Breakup.body}`);
  sections.push(`## LinkedIn opener\n${s.linkedinOpener}`);
  sections.push(`## Voicemail script\n${s.voicemailScript}`);
  return sections.join("\n\n") + "\n";
}
