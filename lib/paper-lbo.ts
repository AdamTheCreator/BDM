// Paper LBO scenario generator + math.
// All amounts in $M unless noted. All rates as decimals (0.08 = 8%).

export type Difficulty = "easy" | "medium" | "hard";

export type PaperLBOScenario = {
  id: string;
  difficulty: Difficulty;
  // Inputs shown to learner
  ebitda: number;              // year 0 LTM EBITDA
  entryMultiple: number;       // EV / EBITDA at entry
  leverageMultiple: number;    // Debt / EBITDA
  exitMultiple: number;        // EV / EBITDA at exit
  ebitdaGrowthAnnual: number;  // CAGR
  holdYears: number;
  cashSweepPct: number;        // 0 = no paydown, 0.5 = 50% of FCF sweeps debt
  interestRate: number;        // weighted cost of debt
  taxRate: number;
  // Hidden — answer key
  expected: {
    entryEv: number;
    entryDebt: number;
    entryEquity: number;
    exitEbitda: number;
    exitEv: number;
    exitDebt: number;
    exitEquity: number;
    moic: number;
    irr: number;               // decimal
  };
};

const choice = <T,>(arr: readonly T[], rng: () => number): T =>
  arr[Math.floor(rng() * arr.length)];

// Deterministic RNG so we can replay a seed.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRESETS: Record<Difficulty, {
  ebitda: readonly number[];
  entryMultiple: readonly number[];
  leverageMultiple: readonly number[];
  exitDelta: readonly number[];      // exit - entry multiple
  growth: readonly number[];
  hold: readonly number[];
  sweep: readonly number[];
  interest: readonly number[];
  tax: readonly number[];
}> = {
  easy: {
    ebitda: [50, 100, 150, 200],
    entryMultiple: [8, 10, 12],
    leverageMultiple: [4, 5, 6],
    exitDelta: [0],                  // same multiple
    growth: [0.05, 0.08, 0.10],
    hold: [5],
    sweep: [0],                       // no paydown
    interest: [0.07],
    tax: [0.25],
  },
  medium: {
    ebitda: [75, 125, 175, 225],
    entryMultiple: [9, 10, 11, 12],
    leverageMultiple: [4, 5, 6],
    exitDelta: [-1, 0, 1],
    growth: [0.04, 0.06, 0.08, 0.10, 0.12],
    hold: [4, 5, 6],
    sweep: [0],
    interest: [0.07, 0.08],
    tax: [0.25],
  },
  hard: {
    ebitda: [60, 110, 180, 240, 320],
    entryMultiple: [9, 10, 11, 12, 13, 14],
    leverageMultiple: [4, 5, 6, 7],
    exitDelta: [-2, -1, 0, 1, 2],
    growth: [0.03, 0.05, 0.07, 0.10, 0.13],
    hold: [3, 4, 5, 6, 7],
    sweep: [0.5, 0.75],               // partial debt paydown
    interest: [0.06, 0.08, 0.10],
    tax: [0.21, 0.25, 0.27],
  },
};

export function generateScenario(
  difficulty: Difficulty,
  seed: number = Date.now(),
): PaperLBOScenario {
  const rng = mulberry32(seed);
  const p = PRESETS[difficulty];

  const ebitda = choice(p.ebitda, rng);
  const entryMultiple = choice(p.entryMultiple, rng);
  const leverageMultiple = Math.min(choice(p.leverageMultiple, rng), entryMultiple - 1);
  const exitMultiple = Math.max(5, entryMultiple + choice(p.exitDelta, rng));
  const ebitdaGrowthAnnual = choice(p.growth, rng);
  const holdYears = choice(p.hold, rng);
  const cashSweepPct = choice(p.sweep, rng);
  const interestRate = choice(p.interest, rng);
  const taxRate = choice(p.tax, rng);

  const expected = solve({
    ebitda,
    entryMultiple,
    leverageMultiple,
    exitMultiple,
    ebitdaGrowthAnnual,
    holdYears,
    cashSweepPct,
    interestRate,
    taxRate,
  });

  return {
    id: `lbo-${seed.toString(36)}`,
    difficulty,
    ebitda,
    entryMultiple,
    leverageMultiple,
    exitMultiple,
    ebitdaGrowthAnnual,
    holdYears,
    cashSweepPct,
    interestRate,
    taxRate,
    expected,
  };
}

type SolveInput = Omit<PaperLBOScenario, "id" | "difficulty" | "expected">;

export function solve(s: SolveInput): PaperLBOScenario["expected"] {
  const entryEv = s.entryMultiple * s.ebitda;
  const entryDebt = s.leverageMultiple * s.ebitda;
  const entryEquity = entryEv - entryDebt;

  // Year-by-year debt paydown via simple cash sweep proxy.
  // FCF proxy = EBITDA × (1 - tax) - interest expense on outstanding debt.
  // (Ignores D&A, capex, working capital — this is napkin math.)
  let debt = entryDebt;
  for (let y = 1; y <= s.holdYears; y++) {
    const ebitdaY = s.ebitda * Math.pow(1 + s.ebitdaGrowthAnnual, y);
    const interest = debt * s.interestRate;
    const fcf = ebitdaY * (1 - s.taxRate) - interest * (1 - s.taxRate);
    const sweep = Math.max(0, fcf * s.cashSweepPct);
    debt = Math.max(0, debt - sweep);
  }

  const exitEbitda = s.ebitda * Math.pow(1 + s.ebitdaGrowthAnnual, s.holdYears);
  const exitEv = s.exitMultiple * exitEbitda;
  const exitDebt = debt;
  const exitEquity = Math.max(0, exitEv - exitDebt);

  const moic = entryEquity > 0 ? exitEquity / entryEquity : 0;
  const irr = moic > 0 ? Math.pow(moic, 1 / s.holdYears) - 1 : -1;

  return {
    entryEv: round1(entryEv),
    entryDebt: round1(entryDebt),
    entryEquity: round1(entryEquity),
    exitEbitda: round1(exitEbitda),
    exitEv: round1(exitEv),
    exitDebt: round1(exitDebt),
    exitEquity: round1(exitEquity),
    moic: round2(moic),
    irr: round4(irr),
  };
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function round4(n: number) { return Math.round(n * 10000) / 10000; }

export type Guess = {
  irr?: number;     // decimal
  moic?: number;
};

export type GradeResult = {
  irrCorrect: boolean;
  moicCorrect: boolean;
  irrError?: number;        // absolute pp difference
  moicError?: number;
  // Tolerances used
  irrToleranceBps: number;
  moicTolerance: number;
};

export function grade(scenario: PaperLBOScenario, guess: Guess): GradeResult {
  // Tolerance: ±150 bps on IRR, ±0.2x on MOIC for paper LBO.
  const IRR_TOL = 0.015;
  const MOIC_TOL = 0.2;

  const irrError =
    guess.irr !== undefined ? Math.abs(guess.irr - scenario.expected.irr) : undefined;
  const moicError =
    guess.moic !== undefined ? Math.abs(guess.moic - scenario.expected.moic) : undefined;

  return {
    irrCorrect: irrError !== undefined && irrError <= IRR_TOL,
    moicCorrect: moicError !== undefined && moicError <= MOIC_TOL,
    irrError,
    moicError,
    irrToleranceBps: 150,
    moicTolerance: MOIC_TOL,
  };
}
