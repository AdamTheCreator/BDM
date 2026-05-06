import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_HEAVY } from "@/lib/anthropic";
import { thesisSystemPrompt, thesisUserPrompt, ThesisContext } from "@/lib/prompts/thesis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = (await req.json()) as ThesisContext;
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
  return NextResponse.json({ raw: text });
}
