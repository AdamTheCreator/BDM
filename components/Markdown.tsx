// Tiny markdown renderer. Handles the subset Claude emits in lesson bodies:
// h2 (##), h3 (###), paragraphs, bullets (-), bold (**text**), inline code
// (`text`), and fenced code blocks (```). Avoids a runtime dependency.

import React from "react";

export default function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="space-y-4 leading-relaxed">
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
}

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; text: string };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block.
    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    if (/^##\s+/.test(line)) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      i++;
      continue;
    }

    if (/^###\s+/.test(line)) {
      blocks.push({ type: "h3", text: line.replace(/^###\s+/, "") });
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph: gather contiguous non-special lines.
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(##|###|[-*]\s|```)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }

  return blocks;
}

function renderBlock(b: Block, key: number) {
  switch (b.type) {
    case "h2":
      return (
        <h2 key={key} className="text-lg font-semibold tracking-tight mt-2">
          {renderInline(b.text)}
        </h2>
      );
    case "h3":
      return (
        <h3 key={key} className="text-base font-semibold tracking-tight mt-2">
          {renderInline(b.text)}
        </h3>
      );
    case "p":
      return (
        <p key={key} className="text-sm">
          {renderInline(b.text)}
        </p>
      );
    case "ul":
      return (
        <ul key={key} className="list-disc pl-5 text-sm space-y-1">
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre
          key={key}
          className="text-xs font-mono bg-zinc-100 dark:bg-zinc-900 rounded-md p-3 overflow-x-auto"
        >
          <code>{b.text}</code>
        </pre>
      );
  }
}

// Inline: **bold**, `code`. Run bold first, then code, then plain text.
function renderInline(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  // Pattern: **bold** OR `code` OR plain text (anything else, non-greedy)
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      tokens.push(
        <strong key={`b${key++}`}>{tok.slice(2, -2)}</strong>,
      );
    } else if (tok.startsWith("`")) {
      tokens.push(
        <code
          key={`c${key++}`}
          className="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 rounded px-1 py-0.5"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
}
