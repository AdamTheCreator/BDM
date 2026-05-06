import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCourse, COURSE_SLUGS } from "@/lib/courses";
import type { CourseSlug, LessonRef } from "@/lib/types";
import TutorChat from "@/components/TutorChat";
import LessonBody from "@/components/LessonBody";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  if (!COURSE_SLUGS.includes(courseSlug as CourseSlug)) notFound();
  const course = await loadCourse(courseSlug as CourseSlug);

  let lesson: LessonRef | undefined;
  let chapterTitle = "";
  for (const ch of course.chapters) {
    const found = ch.lessons.find((l) => l.slug === lessonSlug);
    if (found) {
      lesson = found;
      chapterTitle = ch.title;
      break;
    }
  }
  if (!lesson) notFound();

  // Compute prev / next for navigation.
  const flat = course.chapters.flatMap((c) => c.lessons);
  const idx = flat.findIndex((l) => l.slug === lessonSlug);
  const prev = idx > 0 ? flat[idx - 1] : undefined;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto px-6 py-8">
      <article className="min-w-0 space-y-6">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href={`/learn/${course.slug}`} className="hover:underline">
              {course.title}
            </Link>
            {chapterTitle && <span> · {chapterTitle}</span>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            {lesson.title}
          </h1>
          <div className="text-xs text-zinc-500 mt-1">
            Lesson {lesson.number} of {course.totalLessons} ·{" "}
            {Math.round(lesson.runtimeSeconds / 60)} min target
          </div>
        </div>

        <LessonBody courseSlug={course.slug} lessonSlug={lesson.slug} />

        <nav className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm">
          {prev ? (
            <Link
              href={`/learn/${course.slug}/${prev.slug}`}
              className="text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/learn/${course.slug}/${next.slug}`}
              className="text-zinc-600 dark:text-zinc-400 hover:underline text-right"
            >
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <aside className="lg:sticky lg:top-4 self-start">
        <TutorChat
          courseTitle={course.title}
          lessonTitle={lesson.title}
        />
      </aside>
    </div>
  );
}
