export type ThesisContext = {
  target: string;
  industry?: string;
  publicInfoSnippet?: string;
};

export function thesisSystemPrompt(): string {
  return `You produce 1-page private equity investment theses on tech-sector targets.

Output STRICT JSON conforming to this TypeScript type:
type ThesisDraft = {
  id: string;
  target: string;
  industry: string;
  marketSize: string;
  businessModel: string;
  financialSnapshot: string;       // revenue, growth, margin, leverage if known; "n/a" if not
  strategicFit: string;            // why a sponsor like Bloom/Marlin/Sumeru would pursue this
  diligenceQuestions: string[];    // 5-8 questions you'd ask in a first call
  redFlags: string[];              // 2-5 candid concerns
  recommendation: "pursue" | "monitor" | "pass";
  rationale: string;               // 2-3 sentences
  createdAt: string;               // ISO date
};

Rules:
- Never fabricate revenue, EBITDA, multiples, or fund returns. If unknown, write "n/a".
- Use only information from the user's prompt and the snippet provided.
- Frame strategicFit through the lens of a tech-focused lower/middle-market PE sponsor.
- Be specific. "Strong unit economics" is useless; "60%+ gross margin SaaS with NRR > 110%" is useful.
`;
}

export function thesisUserPrompt(ctx: ThesisContext): string {
  const lines = [`Target: ${ctx.target}`];
  if (ctx.industry) lines.push(`Industry: ${ctx.industry}`);
  if (ctx.publicInfoSnippet) {
    lines.push("\nPublic info snippet:\n" + ctx.publicInfoSnippet);
  }
  lines.push("\nProduce the ThesisDraft JSON now.");
  return lines.join("\n");
}
