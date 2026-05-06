import Link from "next/link";
import { loadAllCourses } from "@/lib/courses";

export default async function LearnPage() {
  const courses = await loadAllCourses();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Courses</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Link
            key={c.slug}
            href={`/learn/${c.slug}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
          >
            <div className="text-xs text-zinc-500">Course {c.number}</div>
            <div className="mt-1 font-medium">{c.title}</div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {c.description}
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              {c.totalLessons} lessons &middot; {Math.floor(c.totalRuntimeMinutes / 60)}h{" "}
              {c.totalRuntimeMinutes % 60}m
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
