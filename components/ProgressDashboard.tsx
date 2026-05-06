"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadAttempts,
  statsFor,
  type PracticeAttempt,
  type PracticeModule,
  type ModuleStats,
} from "@/lib/practice-storage";
import { loadTheses, type SavedThesis } from "@/lib/thesis-storage";

const MODULES: { key: PracticeModule; label: string; topic: string; href: string }[] = [
  { key: "paper-lbo", label: "Paper LBO", topic: "LBO", href: "/practice/paper-lbo" },
  { key: "accretion-dilution", label: "Accretion / Dilution", topic: "M&A", href: "/practice/accretion-dilution" },
  { key: "thesis-builder", label: "Thesis Builder", topic: "Investing", href: "/practice/thesis-builder" },
  { key: "outbound", label: "Outbound", topic: "Origination", href: "/practice/outbound" },
];

export default function ProgressDashboard() {
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [theses, setTheses] = useState<SavedThesis[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAttempts(loadAttempts());
    setTheses(loadTheses());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  const streak = computeStreak(attempts);
  const recent = [...attempts].reverse().slice(0, 10);
  const moduleStats = MODULES.map((m) => ({ ...m, stats: statsFor(m.key) }));
  const totalAttempts = attempts.length;
  const totalPassed = attempts.filter((a) => a.passed).length;
  const overallPassRate = totalAttempts === 0 ? 0 : totalPassed / totalAttempts;

  // Weakest 3 modules with at least 3 attempts.
  const weakest = [...moduleStats]
    .filter((m) => m.stats.total >= 3)
    .sort((a, b) => a.stats.passRate - b.stats.passRate)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total attempts" value={String(totalAttempts)} />
        <Stat label="Pass rate" value={`${(overallPassRate * 100).toFixed(0)}%`} />
        <Stat label="Streak (days)" value={String(streak)} />
        <Stat label="Theses saved" value={String(theses.length)} />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
          By module
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {moduleStats.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
      </section>

      {weakest.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            Drill these next
          </h2>
          <div className="space-y-2">
            {weakest.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm hover:border-zinc-400 dark:hover:border-zinc-600"
              >
                <span>
                  <span className="font-medium">{m.label}</span>
                  <span className="text-zinc-500 ml-2">{m.topic}</span>
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  {(m.stats.passRate * 100).toFixed(0)}% pass · {m.stats.total} attempts
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {theses.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            Thesis gallery
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
            {theses.slice(0, 10).map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm flex items-baseline justify-between">
                <span>
                  <span className="font-medium">{t.draft.target}</span>
                  <span className="text-zinc-500 ml-2">{t.draft.industry}</span>
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(t.savedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
          Recent attempts
        </h2>
        {recent.length === 0 ? (
          <div className="text-sm text-zinc-500 italic">
            No attempts yet. Start a drill in{" "}
            <Link className="underline" href="/practice/paper-lbo">paper LBO</Link>.
          </div>
        ) : (
          <ul className="text-sm divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
            {recent.map((a, i) => (
              <li
                key={`${a.scenarioId}-${i}`}
                className="px-4 py-2 flex items-baseline justify-between"
              >
                <span>
                  <span
                    className={
                      a.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {a.passed ? "✓" : "✗"}
                  </span>{" "}
                  <span className="font-medium">{moduleLabel(a.module)}</span>
                  <span className="text-zinc-500 ml-2">{a.difficulty}</span>
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(a.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ModuleCard({
  module,
}: {
  module: { key: PracticeModule; label: string; topic: string; href: string; stats: ModuleStats };
}) {
  const { stats } = module;
  const empty = stats.total === 0;
  return (
    <Link
      href={module.href}
      className="block rounded-md border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600"
    >
      <div className="flex items-baseline justify-between">
        <div className="font-medium">{module.label}</div>
        <div className="text-xs text-zinc-500">{module.topic}</div>
      </div>
      {empty ? (
        <div className="mt-2 text-xs text-zinc-500 italic">No attempts yet</div>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <Tile label="Pass rate" value={`${(stats.passRate * 100).toFixed(0)}%`} />
          <Tile label="Total" value={String(stats.total)} />
          <Tile label="Last 7d" value={String(stats.last7Days)} />
        </div>
      )}
    </Link>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5">
      <div className="text-zinc-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function moduleLabel(m: PracticeModule): string {
  return MODULES.find((x) => x.key === m)?.label ?? m;
}

function computeStreak(attempts: PracticeAttempt[]): number {
  if (attempts.length === 0) return 0;
  const days = new Set(
    attempts.map((a) => new Date(a.timestamp).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const today = new Date();
  // Allow today to count even if no activity yet (don't break the streak until tomorrow).
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
