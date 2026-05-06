import AccretionDilution from "@/components/AccretionDilution";

export const metadata = { title: "Accretion / Dilution · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Practice · Accretion / Dilution
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">A/D Drill</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Decide direction (accretive vs. dilutive) and magnitude. Tolerance ±50 bps
        on the A/D %. Focus on the napkin path: acquirer EPS → PF NI bridge → new
        shares → PF EPS.
      </p>
      <div className="mt-8">
        <AccretionDilution />
      </div>
    </div>
  );
}
