"use client";

import { useEffect, useState } from "react";
import type { ThesisDraft } from "@/lib/types";
import {
  loadTheses,
  saveThesis,
  deleteThesis,
  thesisToMarkdown,
  type SavedThesis,
} from "@/lib/thesis-storage";

export default function ThesisBuilder() {
  const [target, setTarget] = useState("");
  const [industry, setIndustry] = useState("");
  const [snippet, setSnippet] = useState("");
  const [draft, setDraft] = useState<ThesisDraft | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedThesis[]>([]);

  useEffect(() => {
    setSaved(loadTheses());
  }, []);

  async function generate() {
    if (!target.trim()) {
      setError("Target company is required.");
      return;
    }
    setError("");
    setDraft(null);
    setLoading(true);
    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: target.trim(),
          industry: industry.trim() || undefined,
          publicInfoSnippet: snippet.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.draft) {
        setError(data.error || "Generation failed");
        return;
      }
      setDraft(data.draft as ThesisDraft);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!draft) return;
    saveThesis(draft);
    setSaved(loadTheses());
  }

  function exportMarkdown() {
    if (!draft) return;
    const md = thesisToMarkdown(draft);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thesis-${slugify(draft.target)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadSaved(t: SavedThesis) {
    setDraft(t.draft);
    setTarget(t.draft.target);
    setIndustry(t.draft.industry);
    setSnippet("");
  }

  function remove(id: string) {
    deleteThesis(id);
    setSaved(loadTheses());
    if (draft?.id === id) setDraft(null);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-zinc-500 text-xs mb-1">Target company</span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. Datadog, Procore, ServiceTitan"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-500 text-xs mb-1">Industry (optional)</span>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. observability, vertical SaaS"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
        </div>
        <label className="text-sm block">
          <span className="block text-zinc-500 text-xs mb-1">
            Public info snippet (optional — paste 10-K MD&A, IR page text, recent press)
          </span>
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={6}
            placeholder="Pasting real public info here will keep Claude grounded — without it, financials will be 'n/a'."
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate thesis"}
          </button>
          {error && <span className="text-sm text-rose-600 dark:text-rose-400">{error}</span>}
          <span className="ml-auto text-xs text-zinc-500">
            Uses Opus — slower, ~30s
          </span>
        </div>
      </section>

      {draft && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">{draft.target}</h2>
              <div className="text-xs text-zinc-500">
                {draft.industry} · created {new Date(draft.createdAt).toLocaleDateString()}
              </div>
            </div>
            <RecommendationBadge recommendation={draft.recommendation} />
          </div>

          <Field label="Market size" value={draft.marketSize} />
          <Field label="Business model" value={draft.businessModel} />
          <Field label="Financial snapshot" value={draft.financialSnapshot} />
          <Field label="Strategic fit" value={draft.strategicFit} />
          <Field label="Rationale" value={draft.rationale} />

          {draft.diligenceQuestions.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                Diligence questions
              </div>
              <ol className="list-decimal pl-5 text-sm space-y-1">
                {draft.diligenceQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          )}

          {draft.redFlags.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                Red flags
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {draft.redFlags.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={save}
              className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-3 py-1.5"
            >
              Save to gallery
            </button>
            <button
              onClick={exportMarkdown}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 text-sm px-3 py-1.5"
            >
              Export Markdown
            </button>
          </div>
        </section>
      )}

      {saved.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            Gallery ({saved.length})
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
            {saved.map((t) => (
              <li
                key={t.id}
                className="px-4 py-3 text-sm flex items-baseline justify-between gap-2"
              >
                <span className="min-w-0">
                  <span className="font-medium">{t.draft.target}</span>
                  <span className="text-zinc-500 ml-2">{t.draft.industry}</span>
                  <span className="text-zinc-500 ml-2">· {t.draft.recommendation}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => loadSaved(t)}
                    className="text-xs underline text-zinc-600 dark:text-zinc-400"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => remove(t.id)}
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function RecommendationBadge({
  recommendation,
}: {
  recommendation: "pursue" | "monitor" | "pass";
}) {
  const styles: Record<typeof recommendation, string> = {
    pursue: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
    monitor: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
    pass: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return (
    <span className={`px-2 py-1 text-xs uppercase tracking-wide rounded-md ${styles[recommendation]}`}>
      {recommendation}
    </span>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
