import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCourse, COURSE_SLUGS } from "@/lib/courses";
import type { CourseSlug } from "@/lib/types";

export async function generateStaticParams() {
  return COURSE_SLUGS.map((courseSlug) => ({ courseSlug }));
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  if (!COURSE_SLUGS.includes(courseSlug as CourseSlug)) notFound();
  const course = await loadCourse(courseSlug as CourseSlug);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="text-xs text-zinc-500">Course {course.number}</div>
      <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{course.description}</p>
      <div className="mt-6 space-y-6">
        {course.chapters.map((ch) => (
          <section key={ch.slug}>
            <h2 className="text-sm uppercase tracking-wide text-zinc-500">
              {ch.title}
            </h2>
            {ch.lessons.length === 0 ? (
              <div className="mt-2 text-sm text-zinc-500 italic">
                Lessons not yet seeded. Run <code>npm run seed:courses</code>.
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
                {ch.lessons.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/learn/${course.slug}/${l.slug}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <span>
                        <span className="text-zinc-500 mr-2">{l.number}.</span>
                        {l.title}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {Math.round(l.runtimeSeconds / 60)}m
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
