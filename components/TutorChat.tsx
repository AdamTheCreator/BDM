"use client";

import { useState, useRef } from "react";
import type { ChatMessage } from "@/lib/anthropic";

type Props = {
  courseTitle: string;
  lessonTitle: string;
  objectives?: string[];
  lessonBody?: string;
};

export default function TutorChat({
  courseTitle,
  lessonTitle,
  objectives = [],
  lessonBody = "",
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: next,
          context: {
            courseTitle,
            lessonTitle,
            objectives,
            lessonBody,
            percentComplete: 0,
            weakAreas: [],
          },
        }),
      });

      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages([...next, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages([
          ...next,
          { role: "assistant", content: `Error: ${(err as Error).message}` },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col h-[70vh]">
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
        Tutor
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
        {messages.length === 0 && (
          <div className="text-zinc-500 italic">
            Ask anything about this lesson. Examples: &ldquo;walk me through the
            revolver circularity,&rdquo; &ldquo;quiz me on this,&rdquo; &ldquo;why does
            depreciation flow that way?&rdquo;
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap"
            }
          >
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              {m.role}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask the tutor…"
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          disabled={streaming}
        />
        <button
          onClick={send}
          disabled={streaming}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm px-3 py-1 disabled:opacity-50"
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
