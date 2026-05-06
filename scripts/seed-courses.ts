/**
 * Seed lesson lists into content/courses/*.json from a WSP TOC source.
 *
 * Usage:
 *   1. Drop the WSP TOC for each course into scripts/wsp-toc/<course-slug>.txt
 *      (one lesson per line, format: "<chapter slug> | <lesson title> | <mm:ss>")
 *   2. Run: npm run seed:courses
 *
 * This is intentionally manual — the WSP TOC is not public and you'll have
 * captured it via copy-paste. The script just normalizes it into JSON.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Course, Chapter, LessonRef, CourseSlug } from "../lib/types";

const COURSES: CourseSlug[] = [
  "financial-statement-modeling",
  "dcf-modeling",
  "ma-modeling",
  "trading-comps",
  "transaction-comps",
  "lbo-modeling",
  "building-buyers-lists",
];

const TOC_DIR = path.join(process.cwd(), "scripts", "wsp-toc");
const COURSES_DIR = path.join(process.cwd(), "content", "courses");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseRuntime(s: string): number {
  const [mm, ss] = s.split(":").map(Number);
  return mm * 60 + (ss || 0);
}

async function seedCourse(slug: CourseSlug): Promise<void> {
  const tocPath = path.join(TOC_DIR, `${slug}.txt`);
  let toc = "";
  try {
    toc = await fs.readFile(tocPath, "utf-8");
  } catch {
    console.log(`[skip] ${slug}: no TOC file at ${tocPath}`);
    return;
  }

  const coursePath = path.join(COURSES_DIR, `${slug}.json`);
  const course = JSON.parse(await fs.readFile(coursePath, "utf-8")) as Course;

  const chaptersByTitle = new Map<string, Chapter>();
  for (const c of course.chapters) chaptersByTitle.set(c.title, { ...c, lessons: [] });

  let n = 0;
  for (const line of toc.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;
    const [chapterTitle, lessonTitle, runtime] = parts;
    n++;
    const lesson: LessonRef = {
      slug: slugify(lessonTitle),
      number: n,
      title: lessonTitle,
      runtimeSeconds: parseRuntime(runtime),
      type: "video",
    };
    const ch = chaptersByTitle.get(chapterTitle);
    if (!ch) {
      console.warn(`  [warn] no chapter "${chapterTitle}" in ${slug}`);
      continue;
    }
    ch.lessons.push(lesson);
  }

  course.chapters = Array.from(chaptersByTitle.values());
  course.totalLessons = n;
  await fs.writeFile(coursePath, JSON.stringify(course, null, 2) + "\n");
  console.log(`[ok] ${slug}: seeded ${n} lessons`);
}

async function main() {
  await fs.mkdir(TOC_DIR, { recursive: true });
  for (const slug of COURSES) await seedCourse(slug);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
