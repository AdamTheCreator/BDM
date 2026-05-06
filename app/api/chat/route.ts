import { NextRequest } from "next/server";
import { streamChat, ChatMessage, MODEL_DEFAULT } from "@/lib/anthropic";
import { tutorSystemPrompt, TutorContext } from "@/lib/prompts/tutor";

export const runtime = "nodejs";

type Body = {
  messages: ChatMessage[];
  context?: TutorContext;
  model?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const system = body.context
    ? tutorSystemPrompt(body.context)
    : "You are a helpful tutor for a learner preparing for PE BD roles.";

  const stream = await streamChat({
    model: body.model ?? MODEL_DEFAULT,
    system,
    messages: body.messages,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
