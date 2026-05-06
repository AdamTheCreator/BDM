import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_HEAVY } from "@/lib/anthropic";
import { thesisSystemPrompt, thesisUserPrompt, type ThesisContext } from "@/lib/prompts/thesis";
import type { ThesisDraft } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = (await req.json()) as ThesisContext;

  if (!ctx.target || ctx.target.trim().length === 0) {
    return NextResponse.json({ error: "target is required" }, { status: 400 });
  }

  const msg = await anthropic().messages.create({
    model: MODEL_HEAVY,
    system: thesisSystemPrompt(),
    messages: [{ role: "user", content: thesisUserPrompt(ctx) }],
    max_tokens: 4000,
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = parseThesis(text);
  if (!parsed) {
    return NextResponse.json({ error: "Could not parse thesis JSON", raw: text }, { status: 502 });
  }

  // Fill defaults the model may have omitted.
  const draft: ThesisDraft = {
    id: parsed.id || `thesis-${Date.now().toString(36)}`,
    target: parsed.target || ctx.target,
    industry: parsed.industry || ctx.industry || "n/a",
    marketSize: parsed.marketSize || "n/a",
    businessModel: parsed.businessModel || "n/a",
    financialSnapshot: parsed.financialSnapshot || "n/a",
    strategicFit: parsed.strategicFit || "n/a",
    diligenceQuestions: Array.isArray(parsed.diligenceQuestions) ? parsed.diligenceQuestions : [],
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    recommendation: ["pursue", "monitor", "pass"].includes(parsed.recommendation as string)
      ? (parsed.recommendation as ThesisDraft["recommendation"])
      : "monitor",
    rationale: parsed.rationale || "n/a",
    createdAt: parsed.createdAt || new Date().toISOString(),
  };

  return NextResponse.json({ draft });
}

function parseThesis(text: string): Partial<ThesisDraft> | null {
  // Try a fenced JSON block first.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  // Then the first { ... } that balances.
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as Partial<ThesisDraft>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
