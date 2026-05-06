import ThesisBuilder from "@/components/ThesisBuilder";

export const metadata = { title: "Thesis Builder · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Practice · Thesis Builder
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Investment Thesis Builder
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Generate a structured 1-page investment thesis on a real target. Save the
        good ones to the gallery; export as Markdown to bring to interviews.
        Paste real public info to keep Claude grounded.
      </p>
      <div className="mt-8">
        <ThesisBuilder />
      </div>
    </div>
  );
}
