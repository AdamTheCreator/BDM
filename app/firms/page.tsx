import Link from "next/link";

const FIRMS = [
  { slug: "bloom", name: "Bloom Equity Partners" },
  { slug: "marlin", name: "Marlin Equity Partners" },
  { slug: "sumeru", name: "Sumeru Equity Partners" },
  { slug: "vista", name: "Vista Equity Partners" },
  { slug: "thoma-bravo", name: "Thoma Bravo" },
  { slug: "genstar", name: "Genstar Capital" },
  { slug: "francisco-partners", name: "Francisco Partners" },
  { slug: "insight", name: "Insight Partners" },
  { slug: "ta-associates", name: "TA Associates" },
  { slug: "summit", name: "Summit Partners" },
  { slug: "berkshire", name: "Berkshire Partners" },
  { slug: "gtcr", name: "GTCR" },
  { slug: "hg", name: "Hg" },
  { slug: "silver-lake", name: "Silver Lake" },
  { slug: "permira", name: "Permira" },
];

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Firm Directory</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Tech-focused PE firms with BD functions. Profiles to be hand-authored in
        Phase 5; refresh button hits Claude with web search.
      </p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {FIRMS.map((f) => (
          <Link
            key={f.slug}
            href={`/firms/${f.slug}`}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            {f.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
