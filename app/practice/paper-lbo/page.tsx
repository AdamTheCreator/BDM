import PaperLBO from "@/components/PaperLBO";

export const metadata = { title: "Paper LBO · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Practice · Paper LBO
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Paper LBO Drill
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Sub-3-minute napkin LBOs. PE interviews test the napkin, not the model.
        IRR within ±150 bps and MOIC within ±0.2x counts as correct.
      </p>
      <div className="mt-8">
        <PaperLBO />
      </div>
    </div>
  );
}
