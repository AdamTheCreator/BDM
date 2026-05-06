import MockInterview from "@/components/MockInterview";

export const metadata = { title: "Behavioral Mock · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Interviews · Behavioral
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Mock Behavioral Interview
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        7 questions, voice-and-tone-matched to a specific firm. Probes follow when
        an answer is vague or unquantified. After the seventh, you get a rubric
        grade with rewrites of your two weakest answers.
      </p>
      <div className="mt-8">
        <MockInterview mode="behavioral" />
      </div>
    </div>
  );
}
