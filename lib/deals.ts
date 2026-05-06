// Filesystem loader for deals written by scripts/refresh-deals.ts.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Deal } from "./types-deal";

const DEALS_DIR = path.join(process.cwd(), "content", "deals");

export async function loadAllDeals(): Promise<Deal[]> {
  let dayDirs: string[];
  try {
    dayDirs = (await fs.readdir(DEALS_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }

  const out: Deal[] = [];
  for (const day of dayDirs) {
    const dirPath = path.join(DEALS_DIR, day);
    const files = (await fs.readdir(dirPath)).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      try {
        const raw = await fs.readFile(path.join(dirPath, f), "utf-8");
        out.push(JSON.parse(raw) as Deal);
      } catch (e) {
        console.warn(`Skipping ${day}/${f}: ${(e as Error).message}`);
      }
    }
  }

  // Newest first by ingestion date, then by id for stability.
  return out.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? -1 : 1;
  });
}

export async function loadDeal(id: string): Promise<Deal | null> {
  const all = await loadAllDeals();
  return all.find((d) => d.id === id) ?? null;
}
