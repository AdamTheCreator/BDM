import Link from "next/link";
import { loadAllDeals } from "@/lib/deals";

export const metadata = { title: "Deal feed · Signal-PE" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const deals = await loadAllDeals();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">Deals</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Daily Feed</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Tech / software / SaaS deals pulled from PE Hub and Axios Pro Rata,
        deduped and structured by Claude. Three drill questions per deal —
        thesis, comp set, multiple — gradable on the teardown page.
      </p>

      {deals.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-sm text-zinc-500">
          No deals ingested yet. Run <code>npm run refresh:deals</code> locally
          (with <code>ANTHROPIC_API_KEY</code> set) and commit the resulting
          files under <code>content/deals/</code>.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {deals.map((d) => (
            <Link
              key={d.id}
              href={`/deals/${d.id}`}
              className="block rounded-md border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-medium">
                  {d.acquirer} <span className="text-zinc-500 font-normal">→</span>{" "}
                  {d.target}
                </div>
                <div className="text-xs text-zinc-500">
                  {d.date} · {d.source.outlet}
                </div>
              </div>
              {(d.ev || d.evMultiple) && (
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {d.ev}
                  {d.ev && d.evMultiple ? " · " : ""}
                  {d.evMultiple}
                </div>
              )}
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {d.thesisSummary}
              </div>
              {d.notedSectors && d.notedSectors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.notedSectors.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] rounded-md bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
