import Link from "next/link";
import { loadAllFirms } from "@/lib/firms";

export const metadata = { title: "Firms · Signal-PE" };

export default async function Page() {
  const firms = await loadAllFirms();
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Firm Directory</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        15 tech-PE firms with BD functions. Profiles capture stable facts only —
        sector focus, geography, BD-team posture. Time-sensitive data (current
        fund size, recent deals, named contacts) is layered in via the refresh
        button on each profile, with explicit verification flags.
      </p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {firms.map((f) => (
          <Link
            key={f.slug}
            href={`/firms/${f.slug}`}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 px-4 py-3 hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <div className="font-medium">{f.name}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{f.hq}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
              {f.sectorFocus.join(" · ")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
