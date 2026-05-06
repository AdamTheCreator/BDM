"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseCIM, CaseRubric, SavedCase } from "@/lib/types-case";
import { loadCases, saveCase, deleteCase } from "@/lib/case-storage";

const DURATION_SECONDS = 30 * 60;
type Phase = "config" | "running" | "submitted";

export default function MockCase() {
  const [phase, setPhase] = useState<Phase>("config");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [industryHint, setIndustryHint] = useState("vertical SaaS");
  const [cim, setCim] = useState<CaseCIM | null>(null);
  const [response, setResponse] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [rubric, setRubric] = useState<CaseRubric | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SavedCase[]>([]);

  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setHistory(loadCases().slice().reverse());
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  async function start() {
    setError("");
    setRubric(null);
    setResponse("");
    setSecondsLeft(DURATION_SECONDS);
    setGenerating(true);
    try {
      const res = await fetch("/api/case/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, industryHint: industryHint || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.cim) {
        setError(data.error || "Could not generate CIM");
        return;
      }
      setCim(data.cim as CaseCIM);
      setPhase("running");
      startedAtRef.current = Date.now();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (!cim) return;
    if (response.trim().length < 30) {
      setError("Write at least a few sentences before submitting.");
      return;
    }
    setError("");
    setGrading(true);
    try {
      const durationSeconds = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : DURATION_SECONDS - secondsLeft;
      const res = await fetch("/api/case/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cim, responseText: response, durationSeconds }),
      });
      const data = await res.json();
      if (!res.ok || !data.rubric) {
        setError(data.error || "Could not grade response");
        return;
      }
      const r = data.rubric as CaseRubric;
      setRubric(r);
      setPhase("submitted");
      const saved: SavedCase = {
        id: `sc-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        cim,
        responseText: response,
        rubric: r,
        durationSeconds,
      };
      saveCase(saved);
      setHistory(loadCases().slice().reverse());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGrading(false);
    }
  }

  function reset() {
    setPhase("config");
    setCim(null);
    setResponse("");
    setRubric(null);
    setSecondsLeft(DURATION_SECONDS);
    setError("");
    startedAtRef.current = null;
  }

  function loadOne(s: SavedCase) {
    setCim(s.cim);
    setResponse(s.responseText);
    setRubric(s.rubric);
    setPhase("submitted");
    setSecondsLeft(0);
  }

  function remove(id: string) {
    deleteCase(id);
    setHistory(loadCases().slice().reverse());
  }

  return (
    <div className="space-y-6">
      {phase === "config" && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-zinc-500 text-xs mb-1">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="easy">Easy — clear pursue or pass</option>
                <option value="medium">Medium — 50/50, real risks</option>
                <option value="hard">Hard — hidden quality issue</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-zinc-500 text-xs mb-1">
                Industry hint (optional)
              </span>
              <input
                value={industryHint}
                onChange={(e) => setIndustryHint(e.target.value)}
                placeholder="e.g. vertical SaaS, healthcare services"
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </label>
          </div>
          <p className="text-xs text-zinc-500">
            On start: a CIM appears, a 30-minute timer begins. Submit any time;
            past the timer, you can still submit but Claude knows you took longer.
          </p>
          <button
            onClick={start}
            disabled={generating}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {generating ? "Generating CIM…" : "Start case"}
          </button>
          {error && (
            <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>
          )}
        </div>
      )}

      {(phase === "running" || phase === "submitted") && cim && (
        <>
          <div className="flex items-baseline justify-between gap-3 sticky top-0 bg-white dark:bg-zinc-950 z-10 py-2 -my-2">
            <div>
              <h2 className="text-lg font-semibold">{cim.target}</h2>
              <div className="text-xs text-zinc-500">{cim.industry}</div>
            </div>
            {phase === "running" && (
              <Timer secondsLeft={secondsLeft} />
            )}
            {phase === "submitted" && (
              <button
                onClick={reset}
                className="rounded-md border border-zinc-300 dark:border-zinc-700 text-sm px-3 py-1.5"
              >
                New case
              </button>
            )}
          </div>

          <CIMCard cim={cim} />

          {phase === "running" && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="text-sm font-medium">
                Your investment recommendation
              </div>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={14}
                placeholder="Recommend pursue or pass. Lead with thesis. Cover financials, key risks, what you'd diligence first. ~400-600 words."
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  {countWords(response)} words
                </div>
                <button
                  onClick={submit}
                  disabled={grading}
                  className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5 disabled:opacity-50"
                >
                  {grading ? "Grading…" : "Submit"}
                </button>
              </div>
              {error && (
                <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>
              )}
            </div>
          )}

          {phase === "submitted" && rubric && (
            <RubricView rubric={rubric} responseText={response} />
          )}
        </>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            Case history ({history.length})
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
            {history.slice(0, 10).map((h) => {
              const avg =
                Object.values(h.rubric.scores).reduce((s, v) => s + v, 0) /
                Object.values(h.rubric.scores).length;
              return (
                <li
                  key={h.id}
                  className="px-4 py-3 text-sm flex items-baseline justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{h.cim.target}</span>
                    <span className="text-zinc-500 ml-2">
                      {h.cim.industry} · {h.rubric.candidateConclusion}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-500">
                      avg {avg.toFixed(1)}/5 ·{" "}
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => loadOne(h)}
                      className="text-xs underline text-zinc-600 dark:text-zinc-400"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => remove(h.id)}
                      className="text-xs underline text-rose-600 dark:text-rose-400"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Timer({ secondsLeft }: { secondsLeft: number }) {
  const min = Math.floor(secondsLeft / 60);
  const sec = secondsLeft % 60;
  const expired = secondsLeft === 0;
  const warning = secondsLeft > 0 && secondsLeft <= 5 * 60;
  const color = expired
    ? "text-rose-600 dark:text-rose-400"
    : warning
    ? "text-amber-600 dark:text-amber-400"
    : "text-zinc-700 dark:text-zinc-300";
  return (
    <div className={`text-2xl font-mono tabular-nums ${color}`}>
      {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
      {expired && <span className="text-xs ml-2 align-middle">over time</span>}
    </div>
  );
}

function CIMCard({ cim }: { cim: CaseCIM }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 text-sm">
      <Row k="Business model" v={cim.businessModel} />
      <Row k="Market context" v={cim.marketContext} />
      <Row k="Competitive position" v={cim.competitivePosition} />
      <Row k="Customer base" v={cim.customerBase} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <Tile k="Revenue" v={cim.revenue} />
        <Tile k="Growth" v={cim.growth} />
        <Tile k="Gross margin" v={cim.grossMargin} />
        <Tile k="EBITDA margin" v={cim.ebitdaMargin} />
      </div>
      {cim.askingPrice && (
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Row k="Asking price" v={cim.askingPrice} />
        </div>
      )}
      {cim.risks.length > 0 && (
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
            Risks
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {cim.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RubricView({
  rubric,
  responseText,
}: {
  rubric: CaseRubric;
  responseText: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <div className="text-sm font-semibold">Rubric</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(rubric.scores).map(([k, v]) => (
            <Score key={k} label={k} value={v} />
          ))}
        </div>
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-sm">
          <span className="text-zinc-500">Your conclusion read as:</span>{" "}
          <span className="font-medium uppercase">{rubric.candidateConclusion}</span>
        </div>
      </div>

      {rubric.modelAnswer && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Model answer
          </div>
          <div className="text-sm whitespace-pre-wrap">{rubric.modelAnswer}</div>
        </div>
      )}

      {rubric.topThreeImprovements.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Top three improvements
          </div>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            {rubric.topThreeImprovements.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
        <summary className="text-xs uppercase tracking-wide text-zinc-500 cursor-pointer">
          Your response
        </summary>
        <div className="mt-3 text-sm whitespace-pre-wrap">{responseText}</div>
      </details>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{k}</div>
      <div className="mt-0.5">{v}</div>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-sm bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5">
      <div className="text-xs text-zinc-500">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  const display = value === 0 ? "—" : `${value}/5`;
  const color =
    value === 0 ? "text-zinc-400" :
    value >= 4 ? "text-emerald-600 dark:text-emerald-400" :
    value === 3 ? "text-zinc-700 dark:text-zinc-300" :
    "text-rose-600 dark:text-rose-400";
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
      <div className="text-xs text-zinc-500 capitalize">
        {label.replace(/([A-Z])/g, " $1").trim()}
      </div>
      <div className={`text-lg font-semibold ${color}`}>{display}</div>
    </div>
  );
}

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}
