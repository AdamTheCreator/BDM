// Practice attempt log — feeds the spaced-repetition queue and progress dashboard.

export type PracticeModule =
  | "paper-lbo"
  | "accretion-dilution"
  | "thesis-builder"
  | "outbound";

export type PracticeAttempt = {
  module: PracticeModule;
  scenarioId: string;
  difficulty: string;
  timestamp: string;
  passed: boolean;
};

const KEY = "signal-pe:practice-attempts:v1";

export function loadAttempts(): PracticeAttempt[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PracticeAttempt[];
  } catch {
    return [];
  }
}

export function recordAttempt(a: PracticeAttempt): void {
  if (typeof window === "undefined") return;
  const all = loadAttempts();
  all.push(a);
  // Keep last 500 to bound localStorage growth.
  const trimmed = all.slice(-500);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export type ModuleStats = {
  total: number;
  passed: number;
  passRate: number;
  byDifficulty: Record<string, { total: number; passed: number }>;
  last7Days: number;
};

export function statsFor(module: PracticeModule): ModuleStats {
  const all = loadAttempts().filter((a) => a.module === module);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byDifficulty: Record<string, { total: number; passed: number }> = {};
  for (const a of all) {
    const d = (byDifficulty[a.difficulty] ??= { total: 0, passed: 0 });
    d.total++;
    if (a.passed) d.passed++;
  }
  const passed = all.filter((a) => a.passed).length;
  return {
    total: all.length,
    passed,
    passRate: all.length === 0 ? 0 : passed / all.length,
    byDifficulty,
    last7Days: all.filter((a) => new Date(a.timestamp).getTime() >= cutoff).length,
  };
}
