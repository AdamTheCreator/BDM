// Case interview prompts — separate generator and grader.

export type CaseSeed = {
  industryHint?: string;       // e.g. "vertical SaaS", "healthcare services"
  difficulty: "easy" | "medium" | "hard";
};

export function caseGeneratorSystemPrompt(): string {
  return `You generate one-page CIM-style summaries for PE case interview practice.
Output STRICT JSON conforming to:

type CaseCIM = {
  id: string;
  target: string;
  industry: string;
  businessModel: string;
  revenue: string;          // e.g. "$120M LTM"
  growth: string;           // e.g. "22% YoY, decelerating from 35%"
  grossMargin: string;      // e.g. "68%"
  ebitdaMargin: string;     // e.g. "18%, 22% normalized"
  marketContext: string;    // 2 sentences
  customerBase: string;     // concentration, NRR if SaaS, churn
  competitivePosition: string;
  risks: string[];          // 3-5 items
  askingPrice: string;      // sponsor ask, e.g. "$1.4B EV / 14x LTM EBITDA"
};

Rules:
- The target may be fictional but must feel real (plausible industry, name, financials).
- Numbers must internally consistent (revenue × margin = EBITDA).
- Include at least one ambiguous signal (mixed growth, customer concentration,
  margin compression) so the case has a real decision to make.
- Difficulty knob:
  - easy: clear pursue or clear pass; one or two risks.
  - medium: 50/50; risks are real but mitigatable.
  - hard: looks attractive but has a hidden quality issue (revenue quality,
    accounting, or customer concentration) that should change the answer.
- No emojis. No editorializing. Output JSON only.`;
}

export function caseGeneratorUserPrompt(seed: CaseSeed): string {
  return [
    `Difficulty: ${seed.difficulty}`,
    seed.industryHint ? `Industry hint: ${seed.industryHint}` : "",
    "",
    "Generate the CIM JSON now.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function caseGraderSystemPrompt(): string {
  return `You grade PE case interview responses against a CIM you generated.
Output STRICT JSON conforming to:

type CaseRubric = {
  scores: {
    thesisQuality: 1-5;          // is the investment thesis specific and grounded?
    financialReasoning: 1-5;     // do the numbers cited make sense?
    riskIdentification: 1-5;     // did they surface the real risks?
    structure: 1-5;              // is the recommendation organized?
    decisiveness: 1-5;           // pursue or pass — clear and supported?
  };
  candidateConclusion: "pursue" | "pass" | "monitor" | "unclear";
  modelAnswer: string;           // 200 words max
  topThreeImprovements: string[];
};

Grading rules:
- Be honest. A 5 means a partner would sign off; 3 is acceptable; 1 is fail.
- Penalize vague theses ("attractive growth") and reward specifics
  ("vertical SaaS at scale with 130%+ NRR creates a multi-arm wedge").
- The model answer should take a clear stance and defend it in 200 words.
- topThreeImprovements: concrete, actionable; avoid platitudes.`;
}

export function caseGraderUserPrompt(args: {
  cim: unknown;
  responseText: string;
  durationSeconds: number;
}): string {
  return [
    `CIM:`,
    JSON.stringify(args.cim, null, 2),
    ``,
    `Candidate response (took ${Math.round(args.durationSeconds / 60)} minutes):`,
    args.responseText,
    ``,
    `Grade now. Output JSON only.`,
  ].join("\n");
}
