import MockInterview from "@/components/MockInterview";

export const metadata = { title: "Technical Mock · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Interviews · Technical
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Mock Technical Interview
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        6 questions across paper LBO, accretion/dilution, DCF, 3-statement
        linkages, brainteasers, and one industry-investing prompt. Each answer
        gets a model answer immediately so you can recalibrate as you go.
      </p>
      <div className="mt-8">
        <MockInterview mode="technical" />
      </div>
    </div>
  );
}
