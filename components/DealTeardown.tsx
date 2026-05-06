"use client";

import { useEffect, useState } from "react";
import type { Deal, DrillQuestion, DealAttempt } from "@/lib/types-deal";

const KEY = "signal-pe:deal-attempts:v1";

type AttemptMap = Record<string, Record<string, DealAttempt>>;

function loadAttempts(): AttemptMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as AttemptMap; } catch { return {}; }
}

function saveAttempt(a: DealAttempt) {
  if (typeof window === "undefined") return;
  const all = loadAttempts();
  (all[a.dealId] ??= {})[a.questionId] = a;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export default function DealTeardown({ deal }: { deal: Deal }) {
  const [attempts, setAttempts] = useState<Record<string, DealAttempt>>({});

  useEffect(() => {
    setAttempts(loadAttempts()[deal.id] ?? {});
  }, [deal.id]);

  return (
    <article className="mt-3 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {deal.acquirer} → {deal.target}
        </h1>
        <div className="text-xs text-zinc-500 mt-1">
          {deal.date} ·{" "}
          <a
            href={deal.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {deal.source.outlet}
          </a>
        </div>
      </header>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {deal.ev && <Tile k="EV" v={deal.ev} />}
          {deal.evMultiple && <Tile k="Multiple" v={deal.evMultiple} />}
          {deal.notedSectors && deal.notedSectors.length > 0 && (
            <Tile k="Sectors" v={deal.notedSectors.join(", ")} />
          )}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
            Thesis (per Claude extract)
          </div>
          <p className="text-sm">{deal.thesisSummary}</p>
        </div>
      </section>

      <section>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
          Drill questions
        </div>
        <div className="space-y-3">
          {deal.drillQuestions.map((q) => (
            <DrillCard
              key={q.id}
              deal={deal}
              question={q}
              attempt={attempts[q.id]}
              onGraded={(att) => {
                saveAttempt(att);
                setAttempts((m) => ({ ...m, [q.id]: att }));
              }}
            />
          ))}
        </div>
      </section>
    </article>
  );
}

function DrillCard({
  deal,
  question,
  attempt,
  onGraded,
}: {
  deal: Deal;
  question: DrillQuestion;
  attempt?: DealAttempt;
  onGraded: (a: DealAttempt) => void;
}) {
  const [response, setResponse] = useState(attempt?.response ?? "");
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");

  async function grade() {
    if (response.trim().length < 10) {
      setError("Write at least a sentence before grading.");
      return;
    }
    setError("");
    setGrading(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, response }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.score !== "number") {
        setError(data.error || "Grade failed");
        return;
      }
      const att: DealAttempt = {
        dealId: deal.id,
        questionId: question.id,
        response,
        score: data.score,
        feedback: data.feedback,
        modelAnswer: data.modelAnswer,
        attemptedAt: new Date().toISOString(),
      };
      onGraded(att);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGrading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      <div>
        <div className="text-sm font-medium">{question.prompt}</div>
        <div className="text-xs text-zinc-500 mt-0.5 italic">
          rubric: {question.rubric}
        </div>
      </div>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={4}
        placeholder="Your answer…"
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={grade}
          disabled={grading}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-3 py-1.5 disabled:opacity-50"
        >
          {grading ? "Grading…" : attempt ? "Re-grade" : "Grade"}
        </button>
        {error && <span className="text-sm text-rose-600 dark:text-rose-400">{error}</span>}
      </div>
      {attempt && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500">Score</span>
            <span
              className={
                attempt.score >= 0.7
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : attempt.score >= 0.4
                  ? "text-zinc-700 dark:text-zinc-300 font-medium"
                  : "text-rose-600 dark:text-rose-400 font-medium"
              }
            >
              {(attempt.score * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Feedback</div>
            <p>{attempt.feedback}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Model answer</div>
            <p className="text-zinc-700 dark:text-zinc-300">{attempt.modelAnswer}</p>
          </div>
        </div>
      )}
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
