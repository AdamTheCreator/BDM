import { promises as fs } from "node:fs";
import path from "node:path";
import type { FirmStableProfile } from "./types-firm";

const FIRMS_DIR = path.join(process.cwd(), "content", "firms");

export const FIRM_SLUGS = [
  "bloom",
  "marlin",
  "sumeru",
  "vista",
  "thoma-bravo",
  "genstar",
  "francisco-partners",
  "insight",
  "ta-associates",
  "summit",
  "berkshire",
  "gtcr",
  "hg",
  "silver-lake",
  "permira",
] as const;

export type FirmSlug = (typeof FIRM_SLUGS)[number];

export async function loadFirm(slug: FirmSlug): Promise<FirmStableProfile> {
  const file = path.join(FIRMS_DIR, `${slug}.json`);
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as FirmStableProfile;
}

export async function loadAllFirms(): Promise<FirmStableProfile[]> {
  return Promise.all(FIRM_SLUGS.map(loadFirm));
}

export function isFirmSlug(s: string): s is FirmSlug {
  return (FIRM_SLUGS as readonly string[]).includes(s);
}
