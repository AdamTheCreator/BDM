import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL_DEFAULT } from "@/lib/anthropic";
import { loadFirm, isFirmSlug } from "@/lib/firms";
import { firmRefreshSystemPrompt, firmRefreshUserPrompt } from "@/lib/prompts/firm-refresh";
import type { FirmRefreshedData } from "@/lib/types-firm";
import { extractJson } from "@/lib/json-extract";

export const runtime = "nodejs";

type RawField = { value: string; needsVerification: boolean };
type RawOutput = {
  thesis?: RawField;
  currentFundFamily?: RawField;
  recentDealsNarrative?: RawField;
  bdTeamGuidance?: RawField;
  hiringSignals?: RawField;
  interviewPrepNotes?: RawField;
  needsVerification?: string[];
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isFirmSlug(slug)) {
    return NextResponse.json({ error: "unknown firm" }, { status: 404 });
  }

  const firm = await loadFirm(slug);

  const msg = await anthropic().messages.create({
    model: MODEL_DEFAULT,
    system: firmRefreshSystemPrompt(),
    messages: [{ role: "user", content: firmRefreshUserPrompt(firm) }],
    max_tokens: 2500,
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = extractJson<RawOutput>(text);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse refresh JSON", raw: text },
      { status: 502 },
    );
  }

  const refreshed: FirmRefreshedData = {
    slug,
    refreshedAt: new Date().toISOString(),
    thesis: ensureField(parsed.thesis),
    currentFundFamily: ensureField(parsed.currentFundFamily),
    recentDealsNarrative: ensureField(parsed.recentDealsNarrative),
    bdTeamGuidance: ensureField(parsed.bdTeamGuidance),
    hiringSignals: ensureField(parsed.hiringSignals),
    interviewPrepNotes: ensureField(parsed.interviewPrepNotes),
    needsVerification: Array.isArray(parsed.needsVerification)
      ? parsed.needsVerification.filter((s): s is string => typeof s === "string")
      : [],
  };

  return NextResponse.json({ refreshed });
}

function ensureField(f: RawField | undefined): RawField | undefined {
  if (!f) return undefined;
  if (typeof f.value !== "string" || f.value.trim().length === 0) return undefined;
  return {
    value: f.value,
    needsVerification: Boolean(f.needsVerification),
  };
}
