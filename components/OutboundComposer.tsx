"use client";

import { useEffect, useState } from "react";
import type { OutboundSequence, EmailTouch } from "@/lib/types-outbound";
import {
  loadSequences,
  saveSequence,
  deleteSequence,
  sequenceToMarkdown,
} from "@/lib/outbound-storage";

type Persona = OutboundSequence["persona"];
type Angle = OutboundSequence["angle"];

const PERSONAS: { value: Persona; label: string }[] = [
  { value: "ceo", label: "CEO" },
  { value: "cfo", label: "CFO" },
  { value: "advisor", label: "Advisor / Board member" },
  { value: "sponsor", label: "Sponsor / Existing investor" },
];

const ANGLES: { value: Angle; label: string; hint: string }[] = [
  { value: "thematic", label: "Thematic intro", hint: "You've developed a theme; they fit it." },
  { value: "conference", label: "Conference follow-up", hint: "Met or saw them speak recently." },
  { value: "advisor-ref", label: "Advisor referral", hint: "Warm intro from someone they trust." },
  { value: "cold", label: "Cold outreach", hint: "No prior connection; pure thesis-led." },
];

export default function OutboundComposer() {
  const [persona, setPersona] = useState<Persona>("ceo");
  const [angle, setAngle] = useState<Angle>("thematic");
  const [company, setCompany] = useState("");
  const [thesis, setThesis] = useState("");
  const [senderBg, setSenderBg] = useState("");
  const [sequence, setSequence] = useState<OutboundSequence | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<OutboundSequence[]>([]);

  useEffect(() => {
    setSaved(loadSequences());
  }, []);

  async function generate() {
    if (!company.trim()) {
      setError("Company is required.");
      return;
    }
    setError("");
    setSequence(null);
    setLoading(true);
    try {
      const res = await fetch("/api/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          angle,
          company: company.trim(),
          thesisOneLiner: thesis.trim() || undefined,
          senderBackground: senderBg.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.sequence) {
        setError(data.error || "Generation failed");
        return;
      }
      setSequence(data.sequence as OutboundSequence);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function updateEmail(
    field: "initialEmail" | "day3Nudge" | "day10Breakup",
    patch: Partial<EmailTouch>,
  ) {
    if (!sequence) return;
    setSequence({ ...sequence, [field]: { ...sequence[field], ...patch } });
  }

  function save() {
    if (!sequence) return;
    saveSequence(sequence);
    setSaved(loadSequences());
  }

  function exportMarkdown() {
    if (!sequence) return;
    const md = sequenceToMarkdown(sequence);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outbound-${slugify(sequence.company)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadOne(s: OutboundSequence) {
    setSequence(s);
    setPersona(s.persona);
    setAngle(s.angle);
    setCompany(s.company);
    setThesis(s.thesisOneLiner ?? "");
    setSenderBg(s.senderBackground ?? "");
  }

  function remove(id: string) {
    deleteSequence(id);
    setSaved(loadSequences());
    if (sequence?.id === id) setSequence(null);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Persona" value={persona} options={PERSONAS} onChange={(v) => setPersona(v as Persona)} />
          <Select label="Angle" value={angle} options={ANGLES} onChange={(v) => setAngle(v as Angle)} />
        </div>
        <p className="text-xs text-zinc-500">
          {ANGLES.find((a) => a.value === angle)?.hint}
        </p>
        <label className="text-sm block">
          <span className="block text-zinc-500 text-xs mb-1">Company</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Procore, ServiceTitan, Toast"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <label className="text-sm block">
          <span className="block text-zinc-500 text-xs mb-1">Thesis one-liner (recommended)</span>
          <input
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="e.g. Vertical SaaS at scale with embedded fintech upside in trades."
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <label className="text-sm block">
          <span className="block text-zinc-500 text-xs mb-1">Sender background (optional)</span>
          <textarea
            value={senderBg}
            onChange={(e) => setSenderBg(e.target.value)}
            rows={3}
            placeholder="One sentence about you. Skip the resume — just credibility hooks."
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {loading ? "Drafting…" : "Draft sequence"}
          </button>
          {error && <span className="text-sm text-rose-600 dark:text-rose-400">{error}</span>}
        </div>
      </section>

      {sequence && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">
              {sequence.company} · {sequence.persona} · {sequence.angle}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={save}
                className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-3 py-1.5"
              >
                Save
              </button>
              <button
                onClick={exportMarkdown}
                className="rounded-md border border-zinc-300 dark:border-zinc-700 text-sm px-3 py-1.5"
              >
                Export
              </button>
            </div>
          </div>

          <EmailCard
            label="Day 0 — Initial email"
            email={sequence.initialEmail}
            onChange={(p) => updateEmail("initialEmail", p)}
          />
          <EmailCard
            label="Day 3 — Nudge"
            email={sequence.day3Nudge}
            onChange={(p) => updateEmail("day3Nudge", p)}
          />
          <EmailCard
            label="Day 10 — Break-up"
            email={sequence.day10Breakup}
            onChange={(p) => updateEmail("day10Breakup", p)}
          />

          <ScriptCard
            label="LinkedIn opener"
            value={sequence.linkedinOpener}
            onChange={(v) => setSequence({ ...sequence, linkedinOpener: v })}
            rows={2}
          />
          <ScriptCard
            label="Voicemail script (~25s)"
            value={sequence.voicemailScript}
            onChange={(v) => setSequence({ ...sequence, voicemailScript: v })}
            rows={4}
          />
        </section>
      )}

      {saved.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            Gallery ({saved.length})
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
            {saved.map((s) => (
              <li
                key={s.id}
                className="px-4 py-3 text-sm flex items-baseline justify-between gap-2"
              >
                <span className="min-w-0">
                  <span className="font-medium">{s.company}</span>
                  <span className="text-zinc-500 ml-2">
                    {s.persona} · {s.angle}
                  </span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => loadOne(s)}
                    className="text-xs underline text-zinc-600 dark:text-zinc-400"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-xs underline text-rose-600 dark:text-rose-400"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="text-sm">
      <span className="block text-zinc-500 text-xs mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmailCard({
  label,
  email,
  onChange,
}: {
  label: string;
  email: EmailTouch;
  onChange: (p: Partial<EmailTouch>) => void;
}) {
  const fullText = `Subject: ${email.subject}\n\n${email.body}`;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
        <CopyButton text={fullText} />
      </div>
      <input
        value={email.subject}
        onChange={(e) => onChange({ subject: e.target.value })}
        placeholder="Subject"
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      <textarea
        value={email.body}
        onChange={(e) => onChange({ body: e.target.value })}
        rows={6}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      <div className="text-xs text-zinc-500">
        {countWords(email.body)} words
      </div>
    </div>
  );
}

function ScriptCard({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
        <CopyButton text={value} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
