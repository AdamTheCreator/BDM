// Deal shape — written by scripts/refresh-deals.ts to content/deals/YYYY-MM-DD/<slug>.json.

export type Deal = {
  id: string;                // stable hash of acquirer|target
  date: string;              // YYYY-MM-DD (the day we ingested it)
  publishedAt?: string;      // ISO from RSS pubDate if available
  acquirer: string;
  target: string;
  ev?: string;               // e.g. "$1.4B" — keep as string since EVs are often disclosed as ranges
  evMultiple?: string;       // e.g. "12x EBITDA" or "8.5x revenue"
  thesisSummary: string;     // 1-2 sentences
  drillQuestions: DrillQuestion[];
  source: { url: string; outlet: string };
  // Optional context Claude pulls out for downstream grading.
  notedSectors?: string[];
};

export type DrillQuestion = {
  id: string;        // stable within the deal
  prompt: string;
  rubric: string;    // what a strong answer would cover
};

export type DealAttempt = {
  dealId: string;
  questionId: string;
  response: string;
  score: number;     // 0-1
  feedback: string;
  modelAnswer: string;
  attemptedAt: string;
};
