// Outbound sequence shape — separate from lib/types.ts because it's a generated
// artifact (like ThesisDraft), not a content model.

export type EmailTouch = {
  subject: string;
  body: string;
};

export type OutboundSequence = {
  id: string;
  createdAt: string;
  // Inputs that produced it
  persona: "ceo" | "cfo" | "advisor" | "sponsor";
  company: string;
  angle: "thematic" | "conference" | "advisor-ref" | "cold";
  thesisOneLiner?: string;
  senderBackground?: string;
  // Generated content
  initialEmail: EmailTouch;
  day3Nudge: EmailTouch;
  day10Breakup: EmailTouch;
  linkedinOpener: string;
  voicemailScript: string;
};
