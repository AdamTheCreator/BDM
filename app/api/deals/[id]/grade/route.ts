import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_DEFAULT } from "@/lib/anthropic";
import { loadDeal } from "@/lib/deals";
import {
  dealGradeSystemPrompt,
  dealGradeUserPrompt,
} from "@/lib/prompts/deal-extract";
import { extractJson } from "@/lib/json-extract";

export const runtime = "nodejs";

type Body = { questionId: string; response: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Body;

  const deal = await loadDeal(id);
  if (!deal) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }

  const question = deal.drillQuestions.find((q) => q.id === body.questionId);
  if (!question) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  if (!body.response || body.response.trim().length < 10) {
    return NextResponse.json(
      { error: "response too short" },
      { status: 400 },
    );
  }

  const dealContext = [
    `${deal.acquirer} → ${deal.target}`,
    deal.ev ? `EV: ${deal.ev}` : "",
    deal.evMultiple ? `Multiple: ${deal.evMultiple}` : "",
    `Thesis: ${deal.thesisSummary}`,
    deal.notedSectors?.length ? `Sectors: ${deal.notedSectors.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await anthropic().messages.create({
    model: MODEL_DEFAULT,
    system: dealGradeSystemPrompt(),
    messages: [
      {
        role: "user",
        content: dealGradeUserPrompt({
          dealContext,
          question: question.prompt,
          rubric: question.rubric,
          response: body.response,
        }),
      },
    ],
    max_tokens: 800,
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = extractJson<{ score: number; feedback: string; modelAnswer: string }>(text);
  if (!parsed) {
    return NextResponse.json(
      { error: "could not parse grade JSON", raw: text },
      { status: 502 },
    );
  }

  const score = clamp(typeof parsed.score === "number" ? parsed.score : Number(parsed.score), 0, 1);
  return NextResponse.json({
    score,
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    modelAnswer: typeof parsed.modelAnswer === "string" ? parsed.modelAnswer : "",
  });
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(lo, Math.min(hi, n));
}
