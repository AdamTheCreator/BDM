// Interview rubric shapes — matches the JSON the prompts ask Claude to emit.

export type BehavioralRubric = {
  scores: {
    story: number;
    soarAdherence: number;
    specificity: number;
    quantification: number;
    firmFit: number;
  };
  rewrites: { question: string; originalAnswer: string; rewrite: string }[];
  topThreeImprovements: string[];
};

export type TechnicalRubric = {
  scores: {
    lbo: number;
    valuation: number;
    accounting: number;
    ma: number;
    judgment: number;
  };
  biggestGap: string;
  topThreeImprovements: string[];
};

export type SavedInterview = {
  id: string;
  mode: "behavioral" | "technical";
  createdAt: string;
  // Behavioral context
  firmName?: string;
  firmThesis?: string;
  candidateBackground?: string;
  // Technical context
  difficulty?: "associate" | "senior-associate" | "vp";
  focus?: "lbo" | "valuation" | "accounting" | "ma" | "mixed";
  // Transcript + grade
  transcript: { role: "user" | "assistant"; content: string }[];
  rubric: BehavioralRubric | TechnicalRubric;
};
