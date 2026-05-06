"use client";

import { useEffect, useState } from "react";
import type { FirmStableProfile, FirmRefreshedData } from "@/lib/types-firm";
import {
  loadRefreshed,
  saveRefreshed,
  clearRefreshed,
} from "@/lib/firm-storage";

export default function FirmProfile({ firm }: { firm: FirmStableProfile }) {
  const [refreshed, setRefreshed] = useState<FirmRefreshedData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRefreshed(loadRefreshed(firm.slug));
  }, [firm.slug]);

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/firms/${firm.slug}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.refreshed) {
        setError(data.error || "Refresh failed");
        return;
      }
      saveRefreshed(data.refreshed);
      setRefreshed(data.refreshed);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  function clear() {
    clearRefreshed(firm.slug);
    setRefreshed(null);
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Firm Directory
        </div>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{firm.name}</h1>
          <a
            href={firm.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline text-zinc-600 dark:text-zinc-400"
          >
            {firm.website.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="text-sm text-zinc-500 mt-1">{firm.hq}</div>
      </header>

      <section>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
          Overview
        </div>
        <p className="text-sm">{firm.overview}</p>
      </section>

      <section>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
          Sector focus
        </div>
        <div className="flex flex-wrap gap-1.5">
          {firm.sectorFocus.map((s) => (
            <span
              key={s}
              className="text-xs rounded-md bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {firm.notable.length > 0 && (
        <section>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
            Notable
          </div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {firm.notable.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {firm.bdNotes && (
        <section>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
            BD posture
          </div>
          <p className="text-sm">{firm.bdNotes}</p>
        </section>
      )}

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Refreshed view
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {refreshed
                ? `Last refreshed ${new Date(refreshed.refreshedAt).toLocaleString()}`
                : "Not yet refreshed"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {refreshed && (
              <button
                onClick={clear}
                className="text-xs underline text-zinc-600 dark:text-zinc-400"
              >
                Clear
              </button>
            )}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-3 py-1.5 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : refreshed ? "Refresh" : "Run refresh"}
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Claude generates time-sensitive context (thesis framing, fund-family
          shape, deal posture, BD-team guidance, hiring signals, interview prep
          notes) from training data, then flags every field it can&apos;t confirm
          against current public sources. Treat anything tagged{" "}
          <span className="rounded-sm bg-amber-100 dark:bg-amber-900/40 px-1">verify</span>{" "}
          as a starting point, not a citation — open the firm&apos;s website,
          PitchBook, LinkedIn, or recent press to confirm before using in an
          interview or outreach.
        </p>

        {error && (
          <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>
        )}

        {refreshed && <RefreshedBlocks refreshed={refreshed} />}
      </section>
    </div>
  );
}

function RefreshedBlocks({ refreshed }: { refreshed: FirmRefreshedData }) {
  const blocks: { key: string; label: string; field: keyof FirmRefreshedData }[] = [
    { key: "thesis", label: "Thesis", field: "thesis" },
    { key: "fund", label: "Current fund family", field: "currentFundFamily" },
    { key: "deals", label: "Recent deal posture", field: "recentDealsNarrative" },
    { key: "bd", label: "BD team guidance", field: "bdTeamGuidance" },
    { key: "hiring", label: "Hiring signals", field: "hiringSignals" },
    { key: "prep", label: "Interview prep notes", field: "interviewPrepNotes" },
  ];

  return (
    <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
      {blocks.map(({ key, label, field }) => {
        const v = refreshed[field] as { value: string; needsVerification: boolean } | undefined;
        if (!v?.value) return null;
        return (
          <div key={key}>
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1 flex items-baseline gap-2">
              <span>{label}</span>
              {v.needsVerification && (
                <span className="text-[10px] rounded-sm bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 normal-case tracking-normal">
                  verify
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{v.value}</p>
          </div>
        );
      })}

      {refreshed.needsVerification.length > 0 && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 p-3">
          <div className="text-xs uppercase tracking-wide text-amber-900 dark:text-amber-200 mb-1">
            Things to look up before using this
          </div>
          <ul className="list-disc pl-5 text-sm space-y-0.5 text-amber-900 dark:text-amber-100">
            {refreshed.needsVerification.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
