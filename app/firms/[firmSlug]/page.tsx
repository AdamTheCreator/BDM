import { notFound } from "next/navigation";
import { loadFirm, FIRM_SLUGS, isFirmSlug } from "@/lib/firms";
import FirmProfile from "@/components/FirmProfile";

export async function generateStaticParams() {
  return FIRM_SLUGS.map((firmSlug) => ({ firmSlug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ firmSlug: string }>;
}) {
  const { firmSlug } = await params;
  if (!isFirmSlug(firmSlug)) notFound();
  const firm = await loadFirm(firmSlug);
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <FirmProfile firm={firm} />
    </div>
  );
}
