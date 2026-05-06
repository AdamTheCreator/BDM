import Stub from "@/components/Stub";

export default async function Page({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  return (
    <Stub
      phase="Phase 5 · Deals"
      title={`Deal Teardown: ${dealId}`}
      body="Per-deal teardown: thesis, comps, multiple, your answers vs. what the actual investor said publicly."
    />
  );
}
