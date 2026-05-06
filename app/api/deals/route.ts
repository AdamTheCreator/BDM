import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Stub. Phase 5: read deal JSON files from content/deals/YYYY-MM-DD/ and return.
export async function GET() {
  return NextResponse.json({ deals: [], note: "Deal feed not yet wired up — see scripts/refresh-deals.ts." });
}
