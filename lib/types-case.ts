// Case interview types — CIM + rubric.

export type CaseCIM = {
  id: string;
  target: string;            // company name (may be fictional)
  industry: string;
  businessModel: string;
  // Financial snapshot — short strings, e.g. "$120M revenue, growing 22% YoY"
  revenue: string;
  growth: string;
  grossMargin: string;
  ebitdaMargin: string;
  marketContext: string;     // size, dynamics
  customerBase: string;      // concentration, retention
  competitivePosition: string;
  risks: string[];
  askingPrice?: string;      // optional, e.g. "$1.2B EV (10x EBITDA)"
};

export type CaseRubric = {
  scores: {
    thesisQuality: number;
    financialReasoning: number;
    riskIdentification: number;
    structure: number;
    decisiveness: number;
  };
  candidateConclusion: "pursue" | "pass" | "monitor" | "unclear";
  modelAnswer: string;
  topThreeImprovements: string[];
};

export type SavedCase = {
  id: string;
  createdAt: string;
  cim: CaseCIM;
  responseText: string;
  rubric: CaseRubric;
  durationSeconds: number;
};
