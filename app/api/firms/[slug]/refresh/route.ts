import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Stub. Phase 5: prompt Claude with web search to refresh firm profile.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return NextResponse.json({ slug, refreshed: false, note: "Not yet wired." });
}
