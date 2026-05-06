"use client";

import { useEffect, useState } from "react";
import {
  generateScenario,
  grade,
  type AccretionDilutionScenario,
  type Difficulty,
  type GradeResult,
} from "@/lib/accretion-dilution";
import { recordAttempt } from "@/lib/practice-storage";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function AccretionDilution() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [scenario, setScenario] = useState<AccretionDilutionScenario | null>(null);
  const [direction, setDirection] = useState<"accretive" | "dilutive" | "">("");
  const [magnitude, setMagnitude] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    setScenario(generateScenario(difficulty));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newScenario(d: Difficulty) {
    setScenario(generateScenario(d));
    setDirection("");
    setMagnitude("");
    setResult(null);
    setRevealed(false);
    setExplanation("");
  }

  function check() {
    if (!scenario) return;
    const mag = parsePercent(magnitude);
    const signedMag =
      mag !== undefined && direction === "dilutive" ? -Math.abs(mag) :
      mag !== undefined && direction === "accretive" ? Math.abs(mag) :
      mag;
    const r = grade(scenario, {
      accretionPct: signedMag,
      direction: direction || undefined,
    });
    setResult(r);
    setRevealed(true);
    recordAttempt({
      module: "accretion-dilution",
      scenarioId: scenario.id,
      difficulty: scenario.difficulty,
      timestamp: new Date().toISOString(),
      passed: r.directionCorrect && r.magnitudeCorrect,
    });
  }

  async function explain() {
    if (!scenario) return;
    setExplaining(true);
    setExplanation("");
    try {
      const res = await fetch("/api/accretion-dilution/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
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
        <div className="text-xs uppercase tracking-wide text-zinc-500">Scenario · {s.id}</div>
        <div className="mt-2 font-medium">
          {s.acquirerName} acquires {s.targetName}
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Acquirer</div>
            <ul className="space-y-1 text-sm">
              <Row k="Net income" v={`$${s.acquirerNetIncome}M`} />
              <Row k="Shares outstanding" v={`${s.acquirerSharesOutstanding}M`} />
              <Row k="Share price" v={`$${s.acquirerSharePrice}`} />
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Target</div>
            <ul className="space-y-1 text-sm">
              <Row k="Net income" v={`$${s.targetNetIncome}M`} />
              <Row k="Shares outstanding" v={`${s.targetSharesOutstanding}M`} />
              <Row k="Share price" v={`$${s.targetSharePrice}`} />
              <Row k="Premium" v={`${pct(s.premiumPct)}`} />
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Deal terms</div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            <Row k="Cash %" v={pct(s.pctCash)} />
            <Row k="Debt %" v={pct(s.pctDebt)} />
            <Row k="Stock %" v={pct(s.pctStock)} />
            <Row k="Cost of debt" v={pct(s.interestRateOnDebt)} />
            <Row k="Forgone cash yield" v={pct(s.interestRateOnCash)} />
            <Row k="Tax rate" v={pct(s.taxRate)} />
            {s.synergiesPretax > 0 && (
              <Row k="Synergies (pretax)" v={`$${s.synergiesPretax}M`} />
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="text-sm font-medium">Is the deal accretive or dilutive — and by how much?</div>
        <div className="mt-3 flex gap-2">
          {(["accretive", "dilutive"] as const).map((d) => (
            <button
              key={d}
              disabled={revealed}
              onClick={() => setDirection(d)}
              className={
                "px-3 py-1.5 rounded-md text-sm border " +
                (direction === d
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "border-zinc-300 dark:border-zinc-700")
              }
            >
              {d}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm">
          <span className="block text-zinc-500 text-xs mb-1">Magnitude (%)</span>
          <input
            value={magnitude}
            onChange={(e) => setMagnitude(e.target.value)}
            placeholder="e.g. 4"
            disabled={revealed}
            className="w-40 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
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
          <div className="flex items-baseline gap-3 flex-wrap">
            <Badge ok={result.directionCorrect}>
              Direction {result.directionCorrect ? "correct" : "miss"}
              {!result.directionCorrect && ` · was ${result.expectedDirection}`}
            </Badge>
            <Badge ok={result.magnitudeCorrect}>
              Magnitude {result.magnitudeCorrect ? "correct" : "miss"}
            </Badge>
            <span className="text-xs text-zinc-500 ml-auto">
              tolerance: ±{result.toleranceBps} bps
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <Fact k="Purchase price" v={`$${s.expected.purchasePrice}M`} />
            <Fact k="Cash used" v={`$${s.expected.cashUsed}M`} />
            <Fact k="Debt raised" v={`$${s.expected.debtRaised}M`} />
            <Fact k="Stock issued ($)" v={`$${s.expected.stockIssuedValue}M`} />
            <Fact k="New shares" v={`${s.expected.newSharesIssued}M`} />
            <Fact k="A/T new interest" v={`$${s.expected.afterTaxNewInterestExpense}M`} />
            <Fact k="A/T forgone interest" v={`$${s.expected.afterTaxForgoneInterest}M`} />
            <Fact k="A/T synergies" v={`$${s.expected.afterTaxSynergies}M`} />
            <Fact k="PF NI" v={`$${s.expected.pfNetIncome}M`} />
            <Fact k="PF shares" v={`${s.expected.pfShares}M`} />
            <Fact k="Acq EPS → PF EPS" v={`$${s.expected.acquirerEps.toFixed(3)} → $${s.expected.pfEps.toFixed(3)}`} />
            <Fact
              k="A/D %"
              v={`${pct(s.expected.accretionPct)} ${s.expected.accretionPct >= 0 ? "accretive" : "dilutive"}`}
            />
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between gap-4">
      <span className="text-zinc-500">{k}</span>
      <span>{v}</span>
    </li>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{k}</div>
      <div className="font-medium">{v}</div>
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
  return `${(d * 100).toFixed(1)}%`;
}

function parsePercent(s: string): number | undefined {
  const cleaned = s.replace(/[%\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return undefined;
  return Math.abs(n) > 1 ? n / 100 : n;
}
