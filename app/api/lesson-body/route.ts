import { NextRequest } from "next/server";
import { streamChat } from "@/lib/anthropic";
import { loadCourse, COURSE_SLUGS } from "@/lib/courses";
import type { CourseSlug, LessonRef, Chapter } from "@/lib/types";
import {
  lessonBodySystemPrompt,
  lessonBodyUserPrompt,
} from "@/lib/prompts/lesson-body";

export const runtime = "nodejs";

type Body = { courseSlug: string; lessonSlug: string };

const CASE_STUDIES: Record<CourseSlug, string> = {
  "financial-statement-modeling": "Apple's 10-K (3-statement model)",
  "dcf-modeling": "Apple DCF",
  "ma-modeling": "Apple acquiring Disney (illustrative)",
  "trading-comps": "Networking equipment peers — EXTR, CSCO, ANET, HPE, JNPR",
  "transaction-comps": "Brocade/Foundry, Extreme/Enterasys, HP/3COM, Thoma Bravo/Blue Coat",
  "lbo-modeling": "KKR's BMC Software take-private",
  "building-buyers-lists": "Strategic vs. financial buyer screens for a sell-side process",
};

export async function POST(req: NextRequest) {
  const { courseSlug, lessonSlug } = (await req.json()) as Body;

  if (!COURSE_SLUGS.includes(courseSlug as CourseSlug)) {
    return new Response("unknown course", { status: 404 });
  }
  const course = await loadCourse(courseSlug as CourseSlug);

  let lesson: LessonRef | undefined;
  let chapter: Chapter | undefined;
  for (const ch of course.chapters) {
    const found = ch.lessons.find((l) => l.slug === lessonSlug);
    if (found) {
      lesson = found;
      chapter = ch;
      break;
    }
  }
  if (!lesson || !chapter) {
    return new Response("unknown lesson", { status: 404 });
  }

  // Find prev/next lessons (global order across course).
  const flat = course.chapters.flatMap((c) => c.lessons);
  const idx = flat.findIndex((l) => l.slug === lessonSlug);
  const prev = idx > 0 ? flat[idx - 1] : undefined;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined;

  const stream = await streamChat({
    system: lessonBodySystemPrompt(),
    messages: [
      {
        role: "user",
        content: lessonBodyUserPrompt({
          courseTitle: course.title,
          courseDescription: course.description,
          chapterTitle: chapter.title,
          lessonTitle: lesson.title,
          lessonNumber: lesson.number,
          totalLessonsInCourse: course.totalLessons,
          prevLessonTitle: prev?.title,
          nextLessonTitle: next?.title,
          caseStudy: CASE_STUDIES[course.slug],
        }),
      },
    ],
    maxTokens: 1200,
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
