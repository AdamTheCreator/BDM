import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Stub. Vercel's filesystem is read-only at runtime, so refreshing deals from
// a cron requires either (a) Vercel KV / Blob for persistence, or (b) a
// GitHub-API push back to the repo so the next deploy picks up new files.
//
// Until one of those is wired, run `npm run refresh:deals` locally and commit
// the output. See README §Deal feed.
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Runtime deal refresh not configured. Run `npm run refresh:deals` locally and commit, or wire Vercel KV per the README.",
    },
    { status: 503 },
  );
}
