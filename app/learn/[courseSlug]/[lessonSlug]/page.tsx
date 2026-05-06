import { notFound } from "next/navigation";
import { loadCourse, COURSE_SLUGS } from "@/lib/courses";
import type { CourseSlug, LessonRef } from "@/lib/types";
import TutorChat from "@/components/TutorChat";

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

  // Lessons aren't seeded yet — show a graceful placeholder so the route renders.
  const placeholder = !lesson;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto px-6 py-8">
      <article className="min-w-0">
        <div className="text-xs text-zinc-500">
          {course.title} {chapterTitle && `· ${chapterTitle}`}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          {lesson?.title ?? lessonSlug}
        </h1>

        {placeholder ? (
          <div className="mt-6 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-sm text-zinc-500">
            This lesson hasn&apos;t been seeded yet. Run{" "}
            <code>npm run seed:courses</code> to populate the lesson manifest,
            then <code>npm run seed:videos</code> to attach YouTube videos.
            <br />
            <br />
            Use the tutor chat on the right to talk through this topic anyway.
          </div>
        ) : (
          <>
            <div className="mt-6 aspect-video rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
              Video embed (seed videos to populate)
            </div>
            <div className="mt-6 prose dark:prose-invert max-w-none">
              <p className="text-zinc-500 italic">
                Lesson body MDX not yet authored. See spec Phase 3.
              </p>
            </div>
          </>
        )}
      </article>

      <aside className="lg:sticky lg:top-4 self-start">
        <TutorChat
          courseTitle={course.title}
          lessonTitle={lesson?.title ?? lessonSlug}
        />
      </aside>
    </div>
  );
}
