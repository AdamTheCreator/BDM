"use client";

import { useEffect, useRef, useState } from "react";
import type {
  SavedInterview,
  BehavioralRubric,
  TechnicalRubric,
} from "@/lib/types-interview";
import {
  loadInterviews,
  saveInterview,
  deleteInterview,
} from "@/lib/interview-storage";

const SENTINEL = "===INTERVIEW COMPLETE===";
const KICKOFF = "Let's begin.";

type Message = { role: "user" | "assistant"; content: string };

type BehavioralCtx = {
  firmName: string;
  firmThesis: string;
  candidateBackground: string;
};

type TechnicalCtx = {
  difficulty: "associate" | "senior-associate" | "vp";
  focus: "lbo" | "valuation" | "accounting" | "ma" | "mixed";
};

export type MockInterviewProps =
  | { mode: "behavioral" }
  | { mode: "technical" };

export default function MockInterview(props: MockInterviewProps) {
  const isBehavioral = props.mode === "behavioral";

  // Pre-interview config
  const [started, setStarted] = useState(false);
  const [bCtx, setBCtx] = useState<BehavioralCtx>({
    firmName: "Bloom Equity Partners",
    firmThesis:
      "Lower-middle-market tech-enabled services and vertical SaaS; thesis-led origination.",
    candidateBackground:
      "Adam — 15-year enterprise sales engineer transitioning into PE BD. Strong outbound, MEDDPICC, $114M team revenue.",
  });
  const [tCtx, setTCtx] = useState<TechnicalCtx>({
    difficulty: "associate",
    focus: "mixed",
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [rubric, setRubric] = useState<BehavioralRubric | TechnicalRubric | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SavedInterview[]>([]);

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadInterviews().filter((h) => h.mode === props.mode).reverse());
  }, [props.mode]);

  useEffect(() => {
    transcriptRef.current?.scrollTo(0, transcriptRef.current.scrollHeight);
  }, [messages]);

  async function start() {
    setStarted(true);
    setRubric(null);
    setTranscript("");
    setError("");
    // Kickoff lives in messages state so subsequent turns preserve user/assistant
    // alternation. We filter it from the rendered transcript.
    const initial: Message[] = [{ role: "user", content: KICKOFF }];
    setMessages(initial);
    await sendTurn(initial, isBehavioral ? bCtx : tCtx);
  }

  async function answer() {
    const text = input.trim();
    if (!text || streaming || rubric) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    await sendTurn(next, isBehavioral ? bCtx : tCtx);
  }

  async function sendTurn(
    msgs: Message[],
    context: BehavioralCtx | TechnicalCtx,
  ) {
    setStreaming(true);
    setError("");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: props.mode,
          context,
          messages: msgs,
        }),
      });
      if (!res.body) throw new Error("no response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // Optimistic assistant placeholder.
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice(0, -1);
          copy.push({ role: "assistant", content: acc });
          return copy;
        });
      }

      // After stream completes, look for the sentinel.
      const idx = acc.indexOf(SENTINEL);
      if (idx >= 0) {
        const transcriptText = acc.slice(0, idx).trim();
        const rubricText = acc.slice(idx + SENTINEL.length).trim();
        setTranscript(transcriptText);
        const parsed = parseRubric(rubricText);
        if (parsed) {
          setRubric(parsed);
          // Strip the JSON from the visible last message; replace with cleaned transcript.
          setMessages((m) => {
            const copy = m.slice(0, -1);
            copy.push({ role: "assistant", content: transcriptText });
            return copy;
          });
          // Persist.
          const saved: SavedInterview = {
            id: `int-${Date.now().toString(36)}`,
            mode: props.mode,
            createdAt: new Date().toISOString(),
            ...(isBehavioral ? bCtx : tCtx),
            transcript: [...msgs, { role: "assistant", content: transcriptText }],
            rubric: parsed,
          };
          saveInterview(saved);
          setHistory(loadInterviews().filter((h) => h.mode === props.mode).reverse());
        } else {
          setError("Couldn't parse rubric JSON. See last message.");
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setRubric(null);
    setTranscript("");
    setInput("");
    setError("");
  }

  function loadOne(s: SavedInterview) {
    setStarted(true);
    setMessages(s.transcript as Message[]);
    setRubric(s.rubric);
    setTranscript("");
    if (s.mode === "behavioral") {
      setBCtx({
        firmName: s.firmName ?? "",
        firmThesis: s.firmThesis ?? "",
        candidateBackground: s.candidateBackground ?? "",
      });
    } else {
      setTCtx({
        difficulty: s.difficulty ?? "associate",
        focus: s.focus ?? "mixed",
      });
    }
  }

  function remove(id: string) {
    deleteInterview(id);
    setHistory(loadInterviews().filter((h) => h.mode === props.mode).reverse());
  }

  return (
    <div className="space-y-6">
      {!started && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          {isBehavioral ? (
            <>
              <Field
                label="Firm name"
                value={bCtx.firmName}
                onChange={(v) => setBCtx({ ...bCtx, firmName: v })}
              />
              <Field
                label="Firm thesis (1 sentence)"
                value={bCtx.firmThesis}
                onChange={(v) => setBCtx({ ...bCtx, firmThesis: v })}
              />
              <Textarea
                label="Candidate background"
                value={bCtx.candidateBackground}
                onChange={(v) => setBCtx({ ...bCtx, candidateBackground: v })}
                rows={3}
              />
            </>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <Select
                label="Difficulty"
                value={tCtx.difficulty}
                options={[
                  { value: "associate", label: "Associate" },
                  { value: "senior-associate", label: "Senior Associate" },
                  { value: "vp", label: "VP" },
                ]}
                onChange={(v) =>
                  setTCtx({ ...tCtx, difficulty: v as TechnicalCtx["difficulty"] })
                }
              />
              <Select
                label="Focus"
                value={tCtx.focus}
                options={[
                  { value: "mixed", label: "Mixed" },
                  { value: "lbo", label: "LBO" },
                  { value: "valuation", label: "Valuation / DCF" },
                  { value: "accounting", label: "Accounting / 3-statement" },
                  { value: "ma", label: "M&A / accretion" },
                ]}
                onChange={(v) =>
                  setTCtx({ ...tCtx, focus: v as TechnicalCtx["focus"] })
                }
              />
            </div>
          )}
          <button
            onClick={start}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5"
          >
            Start interview
          </button>
        </div>
      )}

      {started && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col h-[60vh]">
          <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wide text-zinc-500 flex items-center justify-between">
            <span>{isBehavioral ? "Behavioral" : "Technical"} interview</span>
            <button onClick={reset} className="underline text-zinc-600 dark:text-zinc-400 normal-case tracking-normal">
              Reset
            </button>
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages
              .map((m, i) => ({ m, i }))
              .filter(({ m, i }) => !(i === 0 && m.role === "user" && m.content === KICKOFF))
              .map(({ m, i }) => (
                <div key={i} className={m.role === "user" ? "" : "text-zinc-700 dark:text-zinc-300"}>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-0.5">
                    {m.role === "user" ? "You" : "Interviewer"}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                  </div>
                </div>
              ))}
          </div>
          {!rubric && (
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    answer();
                  }
                }}
                placeholder="Your answer… (Cmd/Ctrl+Enter to send)"
                rows={3}
                disabled={streaming}
                className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              <button
                onClick={answer}
                disabled={streaming || !input.trim()}
                className="self-start rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-3 py-1.5 disabled:opacity-50"
              >
                {streaming ? "…" : "Send"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>}

      {rubric && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div className="text-sm font-semibold">Rubric</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(rubric.scores).map(([k, v]) => (
              <ScoreTile key={k} label={k} value={v} />
            ))}
          </div>
          {isBehavioralRubric(rubric) && rubric.rewrites.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Rewrites</div>
              {rubric.rewrites.map((r, i) => (
                <div key={i} className="text-sm space-y-1">
                  <div className="font-medium">{r.question}</div>
                  <div className="text-zinc-500">Your answer: {r.originalAnswer}</div>
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400">Better:</span>{" "}
                    {r.rewrite}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isBehavioralRubric(rubric) && rubric.biggestGap && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Biggest gap</div>
              <div className="text-sm mt-1">{rubric.biggestGap}</div>
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
              Top three improvements
            </div>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              {rubric.topThreeImprovements.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>
          <button
            onClick={reset}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-4 py-1.5"
          >
            New interview
          </button>
        </div>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
            History ({history.length})
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
            {history.slice(0, 10).map((h) => (
              <li
                key={h.id}
                className="px-4 py-3 text-sm flex items-baseline justify-between gap-2"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    {h.mode === "behavioral" ? h.firmName : `${h.difficulty} · ${h.focus}`}
                  </span>
                  <span className="text-zinc-500 ml-2">
                    avg{" "}
                    {(
                      Object.values(h.rubric.scores).reduce((s, v) => s + v, 0) /
                      Object.values(h.rubric.scores).filter((v) => v > 0).length
                    ).toFixed(1)}
                    /5
                  </span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-zinc-500">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => loadOne(h)}
                    className="text-xs underline text-zinc-600 dark:text-zinc-400"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => remove(h.id)}
                    className="text-xs underline text-rose-600 dark:text-rose-400"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function isBehavioralRubric(r: BehavioralRubric | TechnicalRubric): r is BehavioralRubric {
  return "rewrites" in r;
}

function parseRubric(text: string): BehavioralRubric | TechnicalRubric | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm block">
      <span className="block text-zinc-500 text-xs mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows: number }) {
  return (
    <label className="text-sm block">
      <span className="block text-zinc-500 text-xs mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm block">
      <span className="block text-zinc-500 text-xs mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const display = value === 0 ? "—" : `${value}/5`;
  const color =
    value === 0 ? "text-zinc-400" :
    value >= 4 ? "text-emerald-600 dark:text-emerald-400" :
    value === 3 ? "text-zinc-700 dark:text-zinc-300" :
    "text-rose-600 dark:text-rose-400";
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
      <div className="text-xs text-zinc-500 capitalize">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{display}</div>
    </div>
  );
}
