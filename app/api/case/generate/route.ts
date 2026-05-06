import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_DEFAULT } from "@/lib/anthropic";
import {
  caseGeneratorSystemPrompt,
  caseGeneratorUserPrompt,
  type CaseSeed,
} from "@/lib/prompts/interview-case";
import type { CaseCIM } from "@/lib/types-case";
import { extractJson } from "@/lib/json-extract";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const seed = (await req.json()) as CaseSeed;

  const msg = await anthropic().messages.create({
    model: MODEL_DEFAULT,
    system: caseGeneratorSystemPrompt(),
    messages: [{ role: "user", content: caseGeneratorUserPrompt(seed) }],
    max_tokens: 2000,
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = extractJson<Partial<CaseCIM>>(text);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse CIM JSON", raw: text },
      { status: 502 },
    );
  }

  const cim: CaseCIM = {
    id: parsed.id || `case-${Date.now().toString(36)}`,
    target: parsed.target || "Unnamed Target",
    industry: parsed.industry || "n/a",
    businessModel: parsed.businessModel || "n/a",
    revenue: parsed.revenue || "n/a",
    growth: parsed.growth || "n/a",
    grossMargin: parsed.grossMargin || "n/a",
    ebitdaMargin: parsed.ebitdaMargin || "n/a",
    marketContext: parsed.marketContext || "n/a",
    customerBase: parsed.customerBase || "n/a",
    competitivePosition: parsed.competitivePosition || "n/a",
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    askingPrice: parsed.askingPrice,
  };

  return NextResponse.json({ cim });
}
