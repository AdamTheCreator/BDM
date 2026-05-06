import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Signal-PE</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          A self-hosted PE/BD learning platform. Mirrors the WSP Premium Package,
          adds the origination layer it doesn&apos;t teach, and tutors with Claude.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Card href="/learn" title="Learn" body="7 courses, 438 lessons. Embedded videos + Claude tutor per lesson." />
        <Card href="/practice/thesis-builder" title="Thesis Builder" body="Build investment theses on real targets. Export as portfolio artifacts." />
        <Card href="/practice/outbound" title="Outbound Composer" body="Cold sequences for execs, advisors, sponsors." />
        <Card href="/interviews/behavioral" title="Mock Interviews" body="Behavioral, technical, and case mocks scoped to specific firms." />
        <Card href="/deals/feed" title="Deal Feed" body="Daily PE deals with Claude-generated drill questions." />
        <Card href="/firms" title="Firm Directory" body="Tech-PE firms with BD functions: thesis, deals, team." />
      </div>
    </div>
  );
}

function Card({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
    >
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</div>
    </Link>
  );
}
