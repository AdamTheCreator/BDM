import { NextRequest } from "next/server";
import { streamChat } from "@/lib/anthropic";
import type { PaperLBOScenario, Guess } from "@/lib/paper-lbo";

export const runtime = "nodejs";

type Body = { scenario: PaperLBOScenario; guess: Guess };

export async function POST(req: NextRequest) {
  const { scenario: s, guess } = (await req.json()) as Body;

  const system = `You explain paper LBO solutions to an interview-prep learner.
Style: 4 short steps, each on one line. No padding, no "great question", no emojis.
Walk the napkin path: entry equity → exit EBITDA → exit EV → exit equity → MOIC → IRR.
End with one line on which assumption swung the outcome most (growth, multiple, leverage, sweep).
If the learner's IRR or MOIC was off, say in one line where they likely missed.`;

  const learnerLine =
    guess.irr !== undefined || guess.moic !== undefined
      ? `Learner answered: IRR ${guess.irr !== undefined ? (guess.irr * 100).toFixed(0) + "%" : "—"}, MOIC ${guess.moic ?? "—"}x.`
      : "Learner did not enter an answer.";

  const user = `Scenario:
- LTM EBITDA: $${s.ebitda}M
- Entry multiple: ${s.entryMultiple}x  → Entry EV $${s.expected.entryEv}M
- Leverage: ${s.leverageMultiple}x EBITDA  → Debt $${s.expected.entryDebt}M, Equity $${s.expected.entryEquity}M
- EBITDA growth: ${(s.ebitdaGrowthAnnual * 100).toFixed(0)}%/yr
- Hold: ${s.holdYears}y
- Exit multiple: ${s.exitMultiple}x
- Cash sweep: ${(s.cashSweepPct * 100).toFixed(0)}% of FCF (interest ${(s.interestRate * 100).toFixed(0)}%, tax ${(s.taxRate * 100).toFixed(0)}%)

Answer key:
- Exit EBITDA $${s.expected.exitEbitda}M, Exit EV $${s.expected.exitEv}M, Exit debt $${s.expected.exitDebt}M, Exit equity $${s.expected.exitEquity}M
- MOIC ${s.expected.moic}x, IRR ${(s.expected.irr * 100).toFixed(0)}%

${learnerLine}

Walk the solution.`;

  const stream = await streamChat({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 600,
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
