import ProgressDashboard from "@/components/ProgressDashboard";

export const metadata = { title: "Progress · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">Progress</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Pass rate, streak, weakest modules, and the artifacts you&apos;ve produced.
        Everything lives in localStorage; clear browser storage to reset.
      </p>
      <div className="mt-8">
        <ProgressDashboard />
      </div>
    </div>
  );
}
