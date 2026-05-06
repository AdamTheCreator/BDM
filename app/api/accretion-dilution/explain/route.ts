import { NextRequest } from "next/server";
import { streamChat } from "@/lib/anthropic";
import type { AccretionDilutionScenario } from "@/lib/accretion-dilution";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { scenario: s } = (await req.json()) as { scenario: AccretionDilutionScenario };

  const system = `You explain accretion/dilution napkin solutions for PE/IB interview prep.
Style: 4 short steps, each on one line. No padding, no "great question", no emojis.
Steps: (1) acquirer EPS, (2) sources & uses + new shares, (3) PF NI bridge, (4) PF EPS → A/D %.
End with one line on the intuition: which lever swung the result (PE arb, after-tax cost of cash/debt, dilution from new shares).`;

  const direction = s.expected.accretionPct >= 0 ? "accretive" : "dilutive";

  const user = `Deal: ${s.acquirerName} acquires ${s.targetName}.

Acquirer:
- NI $${s.acquirerNetIncome}M / ${s.acquirerSharesOutstanding}M shares @ $${s.acquirerSharePrice} → EPS $${s.expected.acquirerEps.toFixed(3)}, P/E ${(s.acquirerSharePrice / s.expected.acquirerEps).toFixed(1)}x

Target:
- NI $${s.targetNetIncome}M / ${s.targetSharesOutstanding}M shares @ $${s.targetSharePrice}, premium ${(s.premiumPct * 100).toFixed(0)}%
- Implied P/E (paid) ≈ ${(((s.targetSharePrice * (1 + s.premiumPct)) * s.targetSharesOutstanding) / s.targetNetIncome).toFixed(1)}x

Financing: ${(s.pctCash * 100).toFixed(0)}% cash / ${(s.pctDebt * 100).toFixed(0)}% debt / ${(s.pctStock * 100).toFixed(0)}% stock
Cost of debt ${(s.interestRateOnDebt * 100).toFixed(0)}%, forgone cash yield ${(s.interestRateOnCash * 100).toFixed(0)}%, tax ${(s.taxRate * 100).toFixed(0)}%
${s.synergiesPretax > 0 ? `Synergies $${s.synergiesPretax}M pretax` : "No synergies"}

Answer key:
- Purchase price $${s.expected.purchasePrice}M
- New shares issued: ${s.expected.newSharesIssued}M
- A/T new interest: $${s.expected.afterTaxNewInterestExpense}M; A/T forgone: $${s.expected.afterTaxForgoneInterest}M; A/T synergies: $${s.expected.afterTaxSynergies}M
- PF NI $${s.expected.pfNetIncome}M / PF shares ${s.expected.pfShares}M = PF EPS $${s.expected.pfEps.toFixed(3)}
- A/D: ${(s.expected.accretionPct * 100).toFixed(1)}% ${direction}

Walk it.`;

  const stream = await streamChat({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 600,
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
