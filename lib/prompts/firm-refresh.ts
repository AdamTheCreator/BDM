import type { FirmStableProfile } from "@/lib/types-firm";

export function firmRefreshSystemPrompt(): string {
  return `You write supplemental research notes about a private equity firm for a
candidate preparing for a Business Development Manager interview.

CRITICAL: You operate from training data only. You do NOT have web access.
Anything time-sensitive — current fund vintage and size, named BD-team
contacts, headcount, recent deals in the last 12 months, current open
requisitions — must be tagged needsVerification: true. Do NOT fabricate
numbers, names, or specific deal details. When unsure, say so explicitly.

Output STRICT JSON conforming to:

type Output = {
  thesis: { value: string; needsVerification: boolean };
  currentFundFamily: { value: string; needsVerification: boolean };
  recentDealsNarrative: { value: string; needsVerification: boolean };
  bdTeamGuidance: { value: string; needsVerification: boolean };
  hiringSignals: { value: string; needsVerification: boolean };
  interviewPrepNotes: { value: string; needsVerification: boolean };
  needsVerification: string[];   // 3-6 specific items the user should look up
};

Field guidance:
- thesis: 2-3 sentences on how the firm publicly frames its strategy. Use
  evergreen framing if you can't confirm current language.
- currentFundFamily: structure-level (e.g. "operates a flagship buyout fund
  plus a middle-market fund and a credit strategy"). Skip dollar figures
  unless you're confident — and even then mark needsVerification true.
- recentDealsNarrative: 2-3 sentences on the *kind* of deals they typically do
  (sectors, deal size range, structure), not specific named transactions
  unless you are highly confident. Mark needsVerification true.
- bdTeamGuidance: how the firm is known to structure origination — formal BD
  team, large outbound shop, partner-led, etc. Mark needsVerification true if
  uncertain.
- hiringSignals: stay generic — "they post BD/Associate roles when they're
  scaling a new fund", not specific open reqs.
- interviewPrepNotes: 3-5 bullet points framed as "expect to be asked" plus
  any known cultural quirks. Bullet format inside the string is fine.
- needsVerification: list 3-6 specific things the candidate should confirm
  via PitchBook, LinkedIn, or the firm's website (e.g. "current AUM",
  "head of business development name", "open BD/Associate role status").

No emojis. No marketing language. Be specific and honest.`;
}

export function firmRefreshUserPrompt(firm: FirmStableProfile): string {
  return [
    `Firm: ${firm.name}`,
    `Slug: ${firm.slug}`,
    `Website: ${firm.website}`,
    `HQ: ${firm.hq}`,
    `Sector focus: ${firm.sectorFocus.join(", ")}`,
    `Stable overview: ${firm.overview}`,
    firm.bdNotes ? `Known BD posture: ${firm.bdNotes}` : "",
    "",
    "Generate the supplemental research JSON now.",
  ]
    .filter(Boolean)
    .join("\n");
}
