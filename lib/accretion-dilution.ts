// Accretion / dilution scenario generator + math.
// Standard PE/IB napkin formula:
//   PF NI    = Acq NI + Target NI - after-tax interest on new debt
//                                  - after-tax foregone interest on cash used
//                                  + after-tax synergies
//   PF Shares = Acq shares + new shares issued (stock-funded portion)
//   PF EPS   = PF NI / PF Shares
//   A/D %    = (PF EPS - Acq EPS) / Acq EPS

export type Difficulty = "easy" | "medium" | "hard";

export type AccretionDilutionScenario = {
  id: string;
  difficulty: Difficulty;

  acquirerName: string;
  targetName: string;

  // Acquirer
  acquirerNetIncome: number;        // $M
  acquirerSharesOutstanding: number; // M shares
  acquirerSharePrice: number;        // $

  // Target
  targetNetIncome: number;           // $M
  targetSharesOutstanding: number;   // M shares
  targetSharePrice: number;          // $
  premiumPct: number;                // 0.30 = 30% premium

  // Financing mix (must sum to 1)
  pctCash: number;
  pctDebt: number;
  pctStock: number;

  // Costs
  interestRateOnDebt: number;
  interestRateOnCash: number;        // foregone return
  taxRate: number;
  synergiesPretax: number;           // $M, run-rate, year 1

  expected: {
    acquirerEps: number;
    purchasePrice: number;
    cashUsed: number;
    debtRaised: number;
    stockIssuedValue: number;
    newSharesIssued: number;
    afterTaxNewInterestExpense: number;
    afterTaxForgoneInterest: number;
    afterTaxSynergies: number;
    pfNetIncome: number;
    pfShares: number;
    pfEps: number;
    accretionPct: number;            // decimal
  };
};

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
const choice = <T,>(arr: readonly T[], rng: () => number): T =>
  arr[Math.floor(rng() * arr.length)];

const ACQ_NAMES = ["Apple", "Microsoft", "Cisco", "Oracle", "ServiceNow", "Salesforce", "Adobe"];
const TGT_NAMES = ["Disney", "Workday", "Splunk", "Datadog", "MongoDB", "Twilio", "Zoom"];

const PRESETS: Record<Difficulty, {
  acqShares: readonly number[];
  acqPrice: readonly number[];
  acqPe: readonly number[];           // sets NI via shares × price / PE
  tgtShares: readonly number[];
  tgtPrice: readonly number[];
  tgtPe: readonly number[];
  premium: readonly number[];
  mix: readonly { c: number; d: number; s: number }[];
  rateDebt: readonly number[];
  rateCash: readonly number[];
  tax: readonly number[];
  synergiesPctOfTargetRev: readonly number[]; // proxy: pct of target NI as synergies
}> = {
  easy: {
    acqShares: [1000, 2000, 5000],
    acqPrice: [100, 150, 200],
    acqPe: [15, 20],
    tgtShares: [100, 200, 300],
    tgtPrice: [40, 60, 80],
    tgtPe: [20, 25],
    premium: [0.20, 0.30],
    mix: [
      { c: 1, d: 0, s: 0 },
      { c: 0, d: 1, s: 0 },
      { c: 0, d: 0, s: 1 },
    ],
    rateDebt: [0.05],
    rateCash: [0.02],
    tax: [0.25],
    synergiesPctOfTargetRev: [0],
  },
  medium: {
    acqShares: [800, 1500, 2500, 4000],
    acqPrice: [80, 120, 160, 200],
    acqPe: [14, 18, 22, 26],
    tgtShares: [80, 150, 250, 400],
    tgtPrice: [30, 50, 70, 90],
    tgtPe: [18, 24, 30, 35],
    premium: [0.20, 0.30, 0.40],
    mix: [
      { c: 0.5, d: 0.5, s: 0 },
      { c: 0.3, d: 0.3, s: 0.4 },
      { c: 0, d: 0.5, s: 0.5 },
    ],
    rateDebt: [0.05, 0.07],
    rateCash: [0.02, 0.04],
    tax: [0.25],
    synergiesPctOfTargetRev: [0],
  },
  hard: {
    acqShares: [600, 1200, 2000, 3500, 5000],
    acqPrice: [60, 100, 140, 180, 220],
    acqPe: [12, 18, 24, 30, 40],
    tgtShares: [60, 120, 200, 350, 500],
    tgtPrice: [25, 45, 65, 85, 110],
    tgtPe: [20, 28, 35, 45, 60],
    premium: [0.15, 0.25, 0.35, 0.45],
    mix: [
      { c: 0.4, d: 0.4, s: 0.2 },
      { c: 0.2, d: 0.5, s: 0.3 },
      { c: 0.1, d: 0.3, s: 0.6 },
      { c: 0.6, d: 0.4, s: 0 },
    ],
    rateDebt: [0.05, 0.07, 0.09],
    rateCash: [0.02, 0.04],
    tax: [0.21, 0.25, 0.27],
    synergiesPctOfTargetRev: [0, 0.1, 0.2],
  },
};

export function generateScenario(
  difficulty: Difficulty,
  seed: number = Date.now(),
): AccretionDilutionScenario {
  const rng = mulberry32(seed);
  const p = PRESETS[difficulty];

  const acquirerName = choice(ACQ_NAMES, rng);
  const targetName = choice(TGT_NAMES.filter((n) => n !== acquirerName), rng);

  const acquirerSharesOutstanding = choice(p.acqShares, rng);
  const acquirerSharePrice = choice(p.acqPrice, rng);
  const acqPe = choice(p.acqPe, rng);
  const acquirerNetIncome = round1(
    (acquirerSharesOutstanding * acquirerSharePrice) / acqPe,
  );

  const targetSharesOutstanding = choice(p.tgtShares, rng);
  const targetSharePrice = choice(p.tgtPrice, rng);
  const tgtPe = choice(p.tgtPe, rng);
  const targetNetIncome = round1(
    (targetSharesOutstanding * targetSharePrice) / tgtPe,
  );

  const premiumPct = choice(p.premium, rng);
  const mix = choice(p.mix, rng);
  const interestRateOnDebt = choice(p.rateDebt, rng);
  const interestRateOnCash = choice(p.rateCash, rng);
  const taxRate = choice(p.tax, rng);
  const synergiesPretax = round1(
    targetNetIncome * choice(p.synergiesPctOfTargetRev, rng),
  );

  const inputs = {
    acquirerNetIncome,
    acquirerSharesOutstanding,
    acquirerSharePrice,
    targetNetIncome,
    targetSharesOutstanding,
    targetSharePrice,
    premiumPct,
    pctCash: mix.c,
    pctDebt: mix.d,
    pctStock: mix.s,
    interestRateOnDebt,
    interestRateOnCash,
    taxRate,
    synergiesPretax,
  };
  const expected = solve(inputs);

  return {
    id: `ad-${seed.toString(36)}`,
    difficulty,
    acquirerName,
    targetName,
    ...inputs,
    expected,
  };
}

type SolveInput = Omit<AccretionDilutionScenario, "id" | "difficulty" | "expected" | "acquirerName" | "targetName">;

export function solve(s: SolveInput): AccretionDilutionScenario["expected"] {
  const acquirerEps = s.acquirerNetIncome / s.acquirerSharesOutstanding;
  const offerPrice = s.targetSharePrice * (1 + s.premiumPct);
  const purchasePrice = offerPrice * s.targetSharesOutstanding;

  const cashUsed = purchasePrice * s.pctCash;
  const debtRaised = purchasePrice * s.pctDebt;
  const stockIssuedValue = purchasePrice * s.pctStock;
  const newSharesIssued = stockIssuedValue / s.acquirerSharePrice;

  const afterTaxNewInterestExpense = debtRaised * s.interestRateOnDebt * (1 - s.taxRate);
  const afterTaxForgoneInterest = cashUsed * s.interestRateOnCash * (1 - s.taxRate);
  const afterTaxSynergies = s.synergiesPretax * (1 - s.taxRate);

  const pfNetIncome =
    s.acquirerNetIncome +
    s.targetNetIncome -
    afterTaxNewInterestExpense -
    afterTaxForgoneInterest +
    afterTaxSynergies;
  const pfShares = s.acquirerSharesOutstanding + newSharesIssued;
  const pfEps = pfNetIncome / pfShares;
  const accretionPct = (pfEps - acquirerEps) / acquirerEps;

  return {
    acquirerEps: round4(acquirerEps),
    purchasePrice: round1(purchasePrice),
    cashUsed: round1(cashUsed),
    debtRaised: round1(debtRaised),
    stockIssuedValue: round1(stockIssuedValue),
    newSharesIssued: round2(newSharesIssued),
    afterTaxNewInterestExpense: round1(afterTaxNewInterestExpense),
    afterTaxForgoneInterest: round1(afterTaxForgoneInterest),
    afterTaxSynergies: round1(afterTaxSynergies),
    pfNetIncome: round1(pfNetIncome),
    pfShares: round1(pfShares),
    pfEps: round4(pfEps),
    accretionPct: round4(accretionPct),
  };
}

function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function round4(n: number) { return Math.round(n * 10000) / 10000; }

export type Guess = {
  accretionPct?: number;             // decimal
  direction?: "accretive" | "dilutive";
};

export type GradeResult = {
  directionCorrect: boolean;
  magnitudeCorrect: boolean;
  magnitudeError?: number;
  toleranceBps: number;
  expectedDirection: "accretive" | "dilutive";
};

export function grade(scenario: AccretionDilutionScenario, guess: Guess): GradeResult {
  const TOL = 0.005; // 50 bps on the accretion %
  const expectedDirection: "accretive" | "dilutive" =
    scenario.expected.accretionPct >= 0 ? "accretive" : "dilutive";
  const directionCorrect =
    guess.direction === expectedDirection ||
    (guess.accretionPct !== undefined &&
      Math.sign(guess.accretionPct) === Math.sign(scenario.expected.accretionPct));
  const magnitudeError =
    guess.accretionPct !== undefined
      ? Math.abs(guess.accretionPct - scenario.expected.accretionPct)
      : undefined;
  return {
    directionCorrect,
    magnitudeCorrect: magnitudeError !== undefined && magnitudeError <= TOL,
    magnitudeError,
    toleranceBps: 50,
    expectedDirection,
  };
}
