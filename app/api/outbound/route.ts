import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_DEFAULT } from "@/lib/anthropic";
import {
  outboundSystemPrompt,
  outboundUserPrompt,
  type OutboundContext,
} from "@/lib/prompts/outbound";
import type { OutboundSequence, EmailTouch } from "@/lib/types-outbound";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = (await req.json()) as OutboundContext;

  if (!ctx.company || !ctx.persona || !ctx.angle) {
    return NextResponse.json(
      { error: "company, persona, angle required" },
      { status: 400 },
    );
  }

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

  const parsed = parseSequence(text);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse sequence JSON", raw: text },
      { status: 502 },
    );
  }

  const sequence: OutboundSequence = {
    id: `seq-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    persona: ctx.persona,
    company: ctx.company,
    angle: ctx.angle,
    thesisOneLiner: ctx.thesisOneLiner,
    senderBackground: ctx.senderBackground,
    initialEmail: ensureEmail(parsed.initialEmail),
    day3Nudge: ensureEmail(parsed.day3Nudge),
    day10Breakup: ensureEmail(parsed.day10Breakup),
    linkedinOpener: typeof parsed.linkedinOpener === "string" ? parsed.linkedinOpener : "",
    voicemailScript: typeof parsed.voicemailScript === "string" ? parsed.voicemailScript : "",
  };

  return NextResponse.json({ sequence });
}

type RawSequence = {
  initialEmail?: Partial<EmailTouch>;
  day3Nudge?: Partial<EmailTouch>;
  day10Breakup?: Partial<EmailTouch>;
  linkedinOpener?: string;
  voicemailScript?: string;
};

function parseSequence(text: string): RawSequence | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as RawSequence;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function ensureEmail(t: Partial<EmailTouch> | undefined): EmailTouch {
  return {
    subject: typeof t?.subject === "string" ? t.subject : "",
    body: typeof t?.body === "string" ? t.body : "",
  };
}
