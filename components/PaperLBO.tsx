"use client";

import { useEffect, useState } from "react";
import {
  generateScenario,
  grade,
  type PaperLBOScenario,
  type Difficulty,
  type GradeResult,
} from "@/lib/paper-lbo";
import { recordAttempt } from "@/lib/practice-storage";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function PaperLBO() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [scenario, setScenario] = useState<PaperLBOScenario | null>(null);
  const [irrInput, setIrrInput] = useState("");
  const [moicInput, setMoicInput] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    newScenario(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newScenario(d: Difficulty) {
    setScenario(generateScenario(d));
    setIrrInput("");
    setMoicInput("");
    setResult(null);
    setRevealed(false);
    setExplanation("");
  }

  function check() {
    if (!scenario) return;
    const irr = parsePercent(irrInput);
    const moic = parseNumber(moicInput);
    const r = grade(scenario, { irr, moic });
    setResult(r);
    setRevealed(true);
    recordAttempt({
      module: "paper-lbo",
      scenarioId: scenario.id,
      difficulty: scenario.difficulty,
      timestamp: new Date().toISOString(),
      passed: r.irrCorrect && r.moicCorrect,
    });
  }

  async function explain() {
    if (!scenario || !result) return;
    setExplaining(true);
    setExplanation("");
    try {
      const res = await fetch("/api/paper-lbo/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          guess: { irr: parsePercent(irrInput), moic: parseNumber(moicInput) },
        }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setExplanation(acc);
      }
    } catch (e) {
      setExplanation(`Error: ${(e as Error).message}`);
    } finally {
      setExplaining(false);
    }
  }

  if (!scenario) return null;

  const s = scenario;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">Difficulty:</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => {
              setDifficulty(d);
              newScenario(d);
            }}
            className={
              "px-3 py-1 rounded-md text-sm border " +
              (difficulty === d
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300")
            }
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => newScenario(difficulty)}
          className="ml-auto text-sm underline text-zinc-600 dark:text-zinc-400"
        >
          New scenario
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Scenario · {s.id}
        </div>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Fact label="LTM EBITDA" value={`$${s.ebitda}M`} />
          <Fact label="Entry multiple" value={`${s.entryMultiple}.0x EBITDA`} />
          <Fact label="Leverage" value={`${s.leverageMultiple}.0x EBITDA`} />
          <Fact label="EBITDA growth" value={`${pct(s.ebitdaGrowthAnnual)}/yr`} />
          <Fact label="Hold period" value={`${s.holdYears} years`} />
          <Fact label="Exit multiple" value={`${s.exitMultiple}.0x EBITDA`} />
          {s.cashSweepPct > 0 && (
            <>
              <Fact label="Cash sweep" value={`${pct(s.cashSweepPct)} of FCF`} />
              <Fact label="Cost of debt" value={`${pct(s.interestRate)}`} />
              <Fact label="Tax rate" value={`${pct(s.taxRate)}`} />
            </>
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="text-sm font-medium">
          Compute IRR and MOIC. No calculator. Round IRR to nearest whole %.
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-zinc-500 text-xs mb-1">IRR (%)</span>
            <input
              value={irrInput}
              onChange={(e) => setIrrInput(e.target.value)}
              placeholder="e.g. 22"
              disabled={revealed}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-500 text-xs mb-1">MOIC (x)</span>
            <input
              value={moicInput}
              onChange={(e) => setMoicInput(e.target.value)}
              placeholder="e.g. 2.5"
              disabled={revealed}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
        </div>
        {!revealed ? (
          <button
            onClick={check}
            className="mt-4 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5"
          >
            Check
          </button>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => newScenario(difficulty)}
              className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5"
            >
              Next
            </button>
            <button
              onClick={explain}
              disabled={explaining}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 text-sm px-4 py-1.5 disabled:opacity-50"
            >
              {explaining ? "Explaining…" : "Explain"}
            </button>
          </div>
        )}
      </div>

      {revealed && result && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div className="flex items-baseline gap-3">
            <Badge ok={result.irrCorrect}>
              IRR {result.irrCorrect ? "correct" : "miss"}
            </Badge>
            <Badge ok={result.moicCorrect}>
              MOIC {result.moicCorrect ? "correct" : "miss"}
            </Badge>
            <span className="text-xs text-zinc-500 ml-auto">
              tolerance: ±{result.irrToleranceBps}bps IRR / ±{result.moicTolerance}x MOIC
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Fact label="Entry EV" value={`$${s.expected.entryEv}M`} />
            <Fact label="Entry debt" value={`$${s.expected.entryDebt}M`} />
            <Fact label="Entry equity" value={`$${s.expected.entryEquity}M`} />
            <Fact label="Exit EBITDA" value={`$${s.expected.exitEbitda}M`} />
            <Fact label="Exit EV" value={`$${s.expected.exitEv}M`} />
            <Fact label="Exit debt" value={`$${s.expected.exitDebt}M`} />
            <Fact label="Exit equity" value={`$${s.expected.exitEquity}M`} />
            <Fact label="MOIC / IRR" value={`${s.expected.moic}x / ${pct(s.expected.irr)}`} />
          </div>
          {explanation && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm whitespace-pre-wrap">
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        "px-2 py-0.5 text-xs rounded-md " +
        (ok
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200")
      }
    >
      {children}
    </span>
  );
}

function pct(d: number): string {
  return `${(d * 100).toFixed(0)}%`;
}

function parsePercent(s: string): number | undefined {
  const cleaned = s.replace(/[%\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
}

function parseNumber(s: string): number | undefined {
  const cleaned = s.replace(/[x\s]/gi, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isNaN(n) ? undefined : n;
}
