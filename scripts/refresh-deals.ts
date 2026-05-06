/**
 * Daily PE/M&A deal feed refresh. See spec §7.
 *
 * Pipeline:
 *   1. Fetch RSS from each source (last 24h)
 *   2. Filter to tech / software / SaaS / tech-enabled services deals (Claude decides)
 *   3. Dedupe by acquirer|target hash
 *   4. Have Claude extract acquirer, target, EV, multiple, thesis + 3 drill questions
 *   5. Write to content/deals/YYYY-MM-DD/<deal-id>.json
 *
 * Run: `npm run refresh:deals`
 *
 * Source URLs change. If one breaks, others keep working — we log and skip.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { parseRss } from "../lib/rss";
import {
  dealExtractSystemPrompt,
  dealExtractUserPrompt,
  type DealSource,
} from "../lib/prompts/deal-extract";
import { extractJson } from "../lib/json-extract";
import type { Deal } from "../lib/types-deal";

type Source = { name: string; url: string };

const SOURCES: Source[] = [
  // RSS endpoints. Update as outlets shift hosting.
  { name: "PE Hub", url: "https://www.pehub.com/feed/" },
  { name: "Axios Pro Rata", url: "https://api.axios.com/feed/pro-rata" },
];

const LOOKBACK_HOURS = 36;
const MAX_PER_SOURCE = 25;
const MAX_EXTRACTIONS = 25;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY missing");
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey });

async function main() {
  const cutoff = Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000;

  const candidates: DealSource[] = [];
  for (const src of SOURCES) {
    try {
      const items = await fetchSource(src);
      const recent = items.filter((i) => {
        if (!i.pubDate) return true; // keep undated; let Claude/dedup handle
        const t = Date.parse(i.pubDate);
        return Number.isNaN(t) || t >= cutoff;
      });
      console.log(`[${src.name}] ${items.length} items, ${recent.length} within ${LOOKBACK_HOURS}h`);
      for (const item of recent.slice(0, MAX_PER_SOURCE)) {
        candidates.push({
          title: item.title,
          url: item.link,
          outlet: src.name,
          description: item.description,
        });
      }
    } catch (e) {
      console.warn(`[${src.name}] fetch failed: ${(e as Error).message}`);
    }
  }

  if (candidates.length === 0) {
    console.log("No candidates pulled. Done.");
    return;
  }

  // Dedupe by URL.
  const byUrl = new Map<string, DealSource>();
  for (const c of candidates) byUrl.set(c.url, c);
  const unique = Array.from(byUrl.values()).slice(0, MAX_EXTRACTIONS);
  console.log(`Extracting ${unique.length} unique candidates with Claude...`);

  const today = new Date().toISOString().slice(0, 10);
  const dayDir = path.join(process.cwd(), "content", "deals", today);
  await fs.mkdir(dayDir, { recursive: true });

  const seenIds = new Set<string>();
  let written = 0;
  let skipped = 0;

  for (const source of unique) {
    try {
      const deal = await extract(source, today);
      if (!deal) {
        skipped++;
        continue;
      }
      if (seenIds.has(deal.id)) {
        skipped++;
        continue;
      }
      seenIds.add(deal.id);

      const file = path.join(dayDir, `${deal.id}.json`);
      // Skip if same deal already written today (idempotent reruns).
      try {
        await fs.access(file);
        console.log(`  · skip (exists): ${deal.target}`);
        skipped++;
        continue;
      } catch {
        // not exists, write it
      }
      await fs.writeFile(file, JSON.stringify(deal, null, 2) + "\n");
      console.log(`  + ${deal.acquirer} → ${deal.target}`);
      written++;
    } catch (e) {
      console.warn(`  ! extract failed for ${source.title}: ${(e as Error).message}`);
      skipped++;
    }
  }

  console.log(`\nDone. ${written} new, ${skipped} skipped/not-tech.`);
}

async function fetchSource(src: Source) {
  const res = await fetch(src.url, {
    headers: { "User-Agent": "Signal-PE/1.0 (study app)" },
    // Don't cache RSS at the runtime layer.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml);
}

type RawExtraction = {
  isTechDeal: boolean;
  acquirer: string | null;
  target: string | null;
  ev: string | null;
  evMultiple: string | null;
  thesisSummary: string;
  notedSectors: string[];
  drillQuestions: { id: string; prompt: string; rubric: string }[];
};

async function extract(source: DealSource, dateStr: string): Promise<Deal | null> {
  const msg = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL_DEFAULT ?? "claude-sonnet-4-5",
    max_tokens: 1500,
    system: dealExtractSystemPrompt(),
    messages: [{ role: "user", content: dealExtractUserPrompt(source) }],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = extractJson<RawExtraction>(text);
  if (!parsed) {
    console.warn(`    parse failed for ${source.url}`);
    return null;
  }
  if (!parsed.isTechDeal || !parsed.acquirer || !parsed.target) {
    return null;
  }

  const id = hashId(`${parsed.acquirer}|${parsed.target}`);
  const deal: Deal = {
    id,
    date: dateStr,
    publishedAt: undefined,
    acquirer: parsed.acquirer,
    target: parsed.target,
    ev: parsed.ev ?? undefined,
    evMultiple: parsed.evMultiple ?? undefined,
    thesisSummary: parsed.thesisSummary,
    drillQuestions: (parsed.drillQuestions || []).slice(0, 3).map((q) => ({
      id: q.id || "q",
      prompt: q.prompt,
      rubric: q.rubric,
    })),
    source: { url: source.url, outlet: source.outlet },
    notedSectors: parsed.notedSectors,
  };
  return deal;
}

function hashId(input: string): string {
  return crypto
    .createHash("sha1")
    .update(input.toLowerCase())
    .digest("hex")
    .slice(0, 10);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
