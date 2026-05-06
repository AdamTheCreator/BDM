import MockCase from "@/components/MockCase";

export const metadata = { title: "Case Mock · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Interviews · Case
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Mock Case Interview
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        CIM-style 1-pager + 30-minute timer. Output a 1-page investment
        recommendation. Hard mode hides a quality issue you have to surface.
        Claude grades against a 5-axis rubric (thesis quality, financial
        reasoning, risk identification, structure, decisiveness).
      </p>
      <div className="mt-8">
        <MockCase />
      </div>
    </div>
  );
}
