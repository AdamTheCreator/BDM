import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_DEFAULT } from "@/lib/anthropic";
import { outboundSystemPrompt, outboundUserPrompt, OutboundContext } from "@/lib/prompts/outbound";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = (await req.json()) as OutboundContext;
  const msg = await anthropic().messages.create({
    model: MODEL_DEFAULT,
    system: outboundSystemPrompt(),
    messages: [{ role: "user", content: outboundUserPrompt(ctx) }],
    max_tokens: 2000,
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  return NextResponse.json({ raw: text });
}
