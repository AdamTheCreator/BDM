import { NextRequest } from "next/server";
import { streamChat, ChatMessage } from "@/lib/anthropic";
import { behavioralSystemPrompt, BehavioralContext } from "@/lib/prompts/interview-behavioral";
import { technicalSystemPrompt, TechnicalContext } from "@/lib/prompts/interview-technical";

export const runtime = "nodejs";

type Body =
  | { mode: "behavioral"; context: BehavioralContext; messages: ChatMessage[] }
  | { mode: "technical"; context: TechnicalContext; messages: ChatMessage[] };

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const system =
    body.mode === "behavioral"
      ? behavioralSystemPrompt(body.context)
      : technicalSystemPrompt(body.context);

  const stream = await streamChat({
    system,
    messages: body.messages,
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
