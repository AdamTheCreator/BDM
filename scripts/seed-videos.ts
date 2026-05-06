/**
 * For each lesson in each course, find candidate YouTube videos and use Claude
 * to score relevance. See spec §6.
 *
 * Requires: YOUTUBE_API_KEY, ANTHROPIC_API_KEY in env.
 *
 * Output: writes videos[] into per-lesson MDX frontmatter under
 *   content/courses/<course-slug>/<NN>-<lesson-slug>.mdx
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Course, CourseSlug, LessonRef, VideoRef } from "../lib/types";

const COURSES: CourseSlug[] = [
  "financial-statement-modeling",
  "dcf-modeling",
  "ma-modeling",
  "trading-comps",
  "transaction-comps",
  "lbo-modeling",
  "building-buyers-lists",
];

// Spec §2.3 — channel allowlist. We boost candidates from these.
const PREFERRED_CHANNELS = new Set([
  "Mergers & Inquisitions / Breaking Into Wall Street",
  "Aswath Damodaran",
  "Corporate Finance Institute",
  "Eric Andrews",
  "Kenji Explains",
  "Edspira",
  "The Plain Bagel",
  "Wall Street Prep",
  "Financeable Training",
  "Peak Frameworks",
  "rareliquid",
]);

const YT_KEY = process.env.YOUTUBE_API_KEY;
if (!YT_KEY) console.warn("YOUTUBE_API_KEY missing — dry run only");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type YTSearchItem = {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; description: string };
};

async function ytSearch(query: string): Promise<YTSearchItem[]> {
  if (!YT_KEY) return [];
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
    `&maxResults=10&videoCategoryId=27&q=${encodeURIComponent(query)}&key=${YT_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  [yt error] ${res.status} for "${query}"`);
    return [];
  }
  const data = (await res.json()) as { items: YTSearchItem[] };
  return data.items ?? [];
}

async function scoreCandidates(
  lessonTitle: string,
  courseTitle: string,
  candidates: YTSearchItem[],
): Promise<VideoRef[]> {
  if (candidates.length === 0) return [];
  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. [${c.snippet.channelTitle}] ${c.snippet.title}\n   ${c.snippet.description.slice(0, 200)}`,
    )
    .join("\n\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    system:
      "You score YouTube videos for educational relevance to a specific finance/PE lesson. " +
      "Output JSON only: an array of {index, score, notes} where index is 1-based, " +
      "score is 0-1, notes is 1-2 sentences. Be strict — generic videos score < 0.5.",
    messages: [
      {
        role: "user",
        content:
          `Course: ${courseTitle}\nLesson: ${lessonTitle}\n\nCandidates:\n${list}\n\n` +
          `Return JSON array of length ${candidates.length}.`,
      },
    ],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  let scored: { index: number; score: number; notes: string }[] = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) scored = JSON.parse(match[0]);
  } catch {
    console.warn("  [parse error] couldn't parse Claude scoring output");
    return [];
  }

  return scored
    .map((s) => {
      const c = candidates[s.index - 1];
      if (!c) return null;
      const isPreferred = PREFERRED_CHANNELS.has(c.snippet.channelTitle);
      const adj = Math.min(1, s.score + (isPreferred ? 0.1 : 0));
      return {
        source: "youtube" as const,
        videoId: c.id.videoId,
        title: c.snippet.title,
        channel: c.snippet.channelTitle,
        durationSeconds: 0,
        relevanceScore: adj,
        notes: s.notes,
      };
    })
    .filter((v): v is VideoRef => v !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}

async function processLesson(
  course: Course,
  lesson: LessonRef,
): Promise<void> {
  const query = `${course.title} ${lesson.title}`;
  console.log(`  - ${lesson.number}. ${lesson.title}`);
  const candidates = await ytSearch(query);
  const videos = await scoreCandidates(lesson.title, course.title, candidates);

  const courseDir = path.join(
    process.cwd(),
    "content",
    "courses",
    course.slug,
  );
  await fs.mkdir(courseDir, { recursive: true });
  const file = path.join(
    courseDir,
    `${String(lesson.number).padStart(2, "0")}-${lesson.slug}.mdx`,
  );

  const frontmatter = JSON.stringify(
    {
      course: course.slug,
      number: lesson.number,
      title: lesson.title,
      wspRuntimeSeconds: lesson.runtimeSeconds,
      objectives: [],
      prerequisites: [],
      videos,
      exercises: [],
      excelTemplates: [],
      furtherReading: [],
    },
    null,
    2,
  );
  const content = `---\n${frontmatter}\n---\n\n# ${lesson.title}\n\n*Lesson body to be authored — see spec Phase 3.*\n`;
  await fs.writeFile(file, content);
}

async function main() {
  for (const slug of COURSES) {
    const coursePath = path.join(
      process.cwd(),
      "content",
      "courses",
      `${slug}.json`,
    );
    const course = JSON.parse(await fs.readFile(coursePath, "utf-8")) as Course;
    console.log(`[course] ${course.title}`);
    for (const ch of course.chapters) {
      for (const lesson of ch.lessons) {
        await processLesson(course, lesson);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
