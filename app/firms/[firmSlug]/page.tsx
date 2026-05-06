import Stub from "@/components/Stub";

export default async function Page({
  params,
}: {
  params: Promise<{ firmSlug: string }>;
}) {
  const { firmSlug } = await params;
  return (
    <Stub
      phase="Phase 5 · Firms"
      title={`Firm Profile: ${firmSlug}`}
      body="Thesis, fund size, recent deals, BD team LinkedIns, hiring signals, interview prep notes. v1 hand-authored; refresh button re-prompts Claude with web search."
    />
  );
}
