/**
 * Regenerate the lesson list for a course using Claude.
 *
 * Used when the hand-authored manifests need refinement, or to mirror an
 * authoritative TOC the user has captured. Existing manifests are overwritten.
 *
 * Usage:
 *   npm run generate:lessons               # all 7 courses
 *   npm run generate:lessons -- dcf-modeling lbo-modeling   # specific courses
 *
 * Requires ANTHROPIC_API_KEY in env.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Course, CourseSlug, LessonRef } from "../lib/types";
import { extractJson } from "../lib/json-extract";

const ALL_SLUGS: CourseSlug[] = [
  "financial-statement-modeling",
  "dcf-modeling",
  "ma-modeling",
  "trading-comps",
  "transaction-comps",
  "lbo-modeling",
  "building-buyers-lists",
];

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY missing.");
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey });

async function generateForCourse(slug: CourseSlug): Promise<void> {
  const file = path.join(COURSES_DIR, `${slug}.json`);
  const course = JSON.parse(await fs.readFile(file, "utf-8")) as Course;

  console.log(`[${slug}] generating ${course.totalLessons} lessons across ${course.chapters.length} chapters`);

  const system = `You design a self-paced PE/IB modeling curriculum. Given a course
and its chapter structure, generate a full lesson breakdown that totals exactly
the requested number of lessons distributed naturally across chapters based on
topic depth.

Output STRICT JSON conforming to:

type Output = {
  lessons: {
    chapter: string;          // chapter slug (must match input)
    title: string;             // concrete, action-oriented
    runtimeSeconds: number;    // 240-720 typical, integer
  }[];
}

Rules:
- Total lesson count must equal exactly the target.
- Each lesson is an atomic learnable unit. Titles are concrete, not generic
  ("Modeling the revolver and circularity", not "Introduction").
- Use the same case-study companies the course already references where natural
  (Apple for FSM/DCF, Apple-Disney for M&A, BMC for LBO, EXTR/CSCO/ANET/HPE/JNPR
  for Trading Comps, etc.).
- runtimeSeconds: 240-720 typical; technical lessons can be longer.
- Sum of runtimeSeconds across all lessons should be approximately the target
  course total (do not exceed it by more than 10%).
- No emojis. No marketing fluff.`;

  const user = [
    `Course: ${course.title}`,
    `Description: ${course.description}`,
    `Target total lessons: ${course.totalLessons}`,
    `Target total runtime (minutes): ${course.totalRuntimeMinutes}`,
    `Chapters (slug — title):`,
    ...course.chapters.map((c) => `  ${c.slug} — ${c.title}`),
    "",
    "Generate the lessons JSON now.",
  ].join("\n");

  const msg = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL_DEFAULT ?? "claude-sonnet-4-5",
    system,
    messages: [{ role: "user", content: user }],
    max_tokens: 8000,
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const parsed = extractJson<{
    lessons: { chapter: string; title: string; runtimeSeconds: number }[];
  }>(text);
  if (!parsed || !Array.isArray(parsed.lessons)) {
    console.error(`  parse failed for ${slug}`);
    return;
  }

  // Bucket lessons by chapter slug, then assign global lesson numbers.
  const byChapter = new Map<string, { title: string; runtimeSeconds: number }[]>();
  for (const ch of course.chapters) byChapter.set(ch.slug, []);

  for (const l of parsed.lessons) {
    const bucket = byChapter.get(l.chapter);
    if (!bucket) {
      console.warn(`  unknown chapter slug: ${l.chapter}`);
      continue;
    }
    bucket.push({ title: l.title, runtimeSeconds: l.runtimeSeconds });
  }

  let n = 1;
  for (const ch of course.chapters) {
    const bucket = byChapter.get(ch.slug) ?? [];
    ch.lessons = bucket.map<LessonRef>((b) => ({
      slug: slugify(b.title),
      number: n++,
      title: b.title,
      runtimeSeconds: b.runtimeSeconds,
      type: "video",
    }));
  }
  course.totalLessons = n - 1;

  await fs.writeFile(file, JSON.stringify(course, null, 2) + "\n");
  console.log(`  wrote ${course.totalLessons} lessons to ${path.relative(process.cwd(), file)}`);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const argv = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = argv.length > 0
    ? (argv.filter((s): s is CourseSlug => ALL_SLUGS.includes(s as CourseSlug)))
    : ALL_SLUGS;

  if (targets.length === 0) {
    console.error("No matching course slugs given. Valid slugs:");
    ALL_SLUGS.forEach((s) => console.error(`  ${s}`));
    process.exit(1);
  }

  for (const slug of targets) {
    try {
      await generateForCourse(slug);
    } catch (e) {
      console.error(`[${slug}] failed:`, (e as Error).message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
