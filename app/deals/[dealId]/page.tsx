import { notFound } from "next/navigation";
import Link from "next/link";
import { loadDeal } from "@/lib/deals";
import DealTeardown from "@/components/DealTeardown";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = await loadDeal(dealId);
  if (!deal) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/deals/feed"
        className="text-xs text-zinc-500 hover:underline"
      >
        ← Back to feed
      </Link>
      <DealTeardown deal={deal} />
    </div>
  );
}
