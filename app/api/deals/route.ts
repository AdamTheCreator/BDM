import { NextResponse } from "next/server";
import { loadAllDeals } from "@/lib/deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await loadAllDeals();
  return NextResponse.json({ deals });
}
