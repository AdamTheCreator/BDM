import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_DEFAULT } from "@/lib/anthropic";
import { graderSystemPrompt, graderUserPrompt } from "@/lib/prompts/grader";
import type { Exercise } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { exercise, response } = (await req.json()) as {
    exercise: Exercise;
    response: string;
  };
  const msg = await anthropic().messages.create({
    model: MODEL_DEFAULT,
    system: graderSystemPrompt(),
    messages: [{ role: "user", content: graderUserPrompt(exercise, response) }],
    max_tokens: 800,
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  return NextResponse.json({ raw: text });
}
