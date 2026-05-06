export default function Stub({
  title,
  body,
  phase,
}: {
  title: string;
  body: string;
  phase: string;
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{phase}</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{body}</p>
      <div className="mt-6 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-sm text-zinc-500">
        Module not yet implemented. See spec for the build plan.
      </div>
    </div>
  );
}
