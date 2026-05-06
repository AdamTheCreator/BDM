import OutboundComposer from "@/components/OutboundComposer";

export const metadata = { title: "Outbound · Signal-PE" };

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Practice · Outbound
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Outbound Composer</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Persona × company × angle → 5-touch sequence (initial, day-3 nudge, day-10
        break-up, LinkedIn opener, voicemail script). Edit inline, copy individual
        touches, save the good ones to the gallery.
      </p>
      <div className="mt-8">
        <OutboundComposer />
      </div>
    </div>
  );
}
