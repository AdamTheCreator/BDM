export type OutboundContext = {
  persona: "ceo" | "cfo" | "advisor" | "sponsor";
  company: string;
  angle: "thematic" | "conference" | "advisor-ref" | "cold";
  thesisOneLiner?: string;
  senderBackground?: string;
};

export function outboundSystemPrompt(): string {
  return `You draft PE business-development outbound sequences for a sender with deep enterprise sales background.
Tone: deferential, thesis-led, never product-pitch-y. Short. No corporate fluff.

For each request produce a 5-touch sequence as JSON:
type Sequence = {
  initialEmail: { subject: string; body: string };
  day3Nudge: { subject: string; body: string };
  day10Breakup: { subject: string; body: string };
  linkedinOpener: string;       // 1-2 sentences, max 300 chars
  voicemailScript: string;      // 25-second script
};

Rules:
- Initial email body <= 90 words.
- Lead with thesis or specific observation about the target. Never lead with sender bio.
- No "hope this finds you well", no "circling back", no "synergy".
- Subjects <= 7 words.
- For advisor-ref angle, name the referrer in the first line ("[Referrer] suggested I reach out about ...").`;
}

export function outboundUserPrompt(ctx: OutboundContext): string {
  return [
    `Persona: ${ctx.persona}`,
    `Company: ${ctx.company}`,
    `Angle: ${ctx.angle}`,
    ctx.thesisOneLiner ? `Thesis one-liner: ${ctx.thesisOneLiner}` : "",
    ctx.senderBackground ? `Sender background: ${ctx.senderBackground}` : "",
    "",
    "Produce the Sequence JSON now.",
  ]
    .filter(Boolean)
    .join("\n");
}
