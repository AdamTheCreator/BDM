// Two prompts: extract deal facts from a news article, and grade a drill answer.

export type DealSource = {
  title: string;
  url: string;
  outlet: string;
  description: string;
};

export function dealExtractSystemPrompt(): string {
  return `You extract structured facts from PE / M&A deal news for a study-app deal feed.

Output STRICT JSON conforming to:

type Output = {
  isTechDeal: boolean;          // tech, software, SaaS, tech-enabled services
  acquirer: string | null;
  target: string | null;
  ev: string | null;            // e.g. "$1.4B" — null if not disclosed
  evMultiple: string | null;    // e.g. "12x EBITDA" or "8.5x revenue" — null if not disclosed
  thesisSummary: string;        // 1-2 sentences on why this deal happened (what the buyer is buying)
  notedSectors: string[];       // 1-3 short tags (e.g. ["vertical SaaS", "fintech"])
  drillQuestions: { id: string; prompt: string; rubric: string }[];
};

Rules:
- If the article isn't about a specific completed or announced acquisition / take-private / buyout, return isTechDeal: false and stub the rest. Don't fabricate a deal that doesn't exist in the article.
- If the deal is not tech / software / SaaS / tech-enabled services, set isTechDeal: false.
- thesisSummary: lead with what the buyer is paying for (consolidation, take-private at a discount, vertical platform, capability tuck-in). Avoid "to drive growth and synergies".
- drillQuestions: produce exactly 3, in this order:
  1) Why did this deal happen? What's the buyer's thesis?
  2) Who else would have wanted this asset, and what's the comp set?
  3) At what multiple was this paid, and is that fair / a stretch / a bargain?
- For each drill question, write a rubric line (1 sentence) describing what a strong answer covers.
- Use stable kebab-case IDs: "thesis", "comps", "multiple".
- No emojis. No editorializing.`;
}

export function dealExtractUserPrompt(s: DealSource): string {
  return [
    `Outlet: ${s.outlet}`,
    `URL: ${s.url}`,
    `Title: ${s.title}`,
    "",
    `Description / excerpt:`,
    s.description.slice(0, 4000),
    "",
    "Extract now. Output JSON only.",
  ].join("\n");
}

export function dealGradeSystemPrompt(): string {
  return `You grade a learner's answer to a deal-news drill question.

Output STRICT JSON:
{ "score": 0-1, "feedback": string (2-3 sentences), "modelAnswer": string (<=80 words) }

Rules:
- Score: 1.0 = a partner would nod; 0.7 = directionally right with gaps; 0.4 = misses the core point; 0.0 = wrong.
- Feedback: state what was right, what was missing, and the single biggest improvement.
- modelAnswer: a tight reference answer.
- No emojis. No "great question".`;
}

export function dealGradeUserPrompt(args: {
  dealContext: string;
  question: string;
  rubric: string;
  response: string;
}): string {
  return [
    `Deal context:`,
    args.dealContext,
    "",
    `Question: ${args.question}`,
    `Rubric: ${args.rubric}`,
    "",
    `Learner response:`,
    args.response,
    "",
    "Grade now. Output JSON only.",
  ].join("\n");
}
