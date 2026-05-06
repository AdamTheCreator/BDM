import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_HEAVY } from "@/lib/anthropic";
import {
  caseGraderSystemPrompt,
  caseGraderUserPrompt,
} from "@/lib/prompts/interview-case";
import type { CaseCIM, CaseRubric } from "@/lib/types-case";
import { extractJson } from "@/lib/json-extract";

export const runtime = "nodejs";

type Body = {
  cim: CaseCIM;
  responseText: string;
  durationSeconds: number;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;

  if (!body.responseText || body.responseText.trim().length < 30) {
    return NextResponse.json(
      { error: "Response too short to grade — write at least a few sentences." },
      { status: 400 },
    );
  }

  const msg = await anthropic().messages.create({
    model: MODEL_HEAVY,
    system: caseGraderSystemPrompt(),
    messages: [
      {
        role: "user",
        content: caseGraderUserPrompt({
          cim: body.cim,
          responseText: body.responseText,
          durationSeconds: body.durationSeconds,
        }),
      },
    ],
    max_tokens: 2000,
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = extractJson<Partial<CaseRubric>>(text);
  if (!parsed || !parsed.scores) {
    return NextResponse.json(
      { error: "Could not parse rubric JSON", raw: text },
      { status: 502 },
    );
  }

  const rubric: CaseRubric = {
    scores: {
      thesisQuality: clamp(parsed.scores.thesisQuality, 0, 5),
      financialReasoning: clamp(parsed.scores.financialReasoning, 0, 5),
      riskIdentification: clamp(parsed.scores.riskIdentification, 0, 5),
      structure: clamp(parsed.scores.structure, 0, 5),
      decisiveness: clamp(parsed.scores.decisiveness, 0, 5),
    },
    candidateConclusion: ["pursue", "pass", "monitor", "unclear"].includes(
      parsed.candidateConclusion as string,
    )
      ? (parsed.candidateConclusion as CaseRubric["candidateConclusion"])
      : "unclear",
    modelAnswer: parsed.modelAnswer || "",
    topThreeImprovements: Array.isArray(parsed.topThreeImprovements)
      ? parsed.topThreeImprovements
      : [],
  };

  return NextResponse.json({ rubric });
}

function clamp(n: unknown, lo: number, hi: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
