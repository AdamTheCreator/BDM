// Server-side course catalog loader. Reads JSON manifests from content/courses/.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Course, CourseSlug } from "./types";

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

export const COURSE_SLUGS: CourseSlug[] = [
  "financial-statement-modeling",
  "dcf-modeling",
  "ma-modeling",
  "trading-comps",
  "transaction-comps",
  "lbo-modeling",
  "building-buyers-lists",
];

export async function loadCourse(slug: CourseSlug): Promise<Course> {
  const file = path.join(COURSES_DIR, `${slug}.json`);
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as Course;
}

export async function loadAllCourses(): Promise<Course[]> {
  return Promise.all(COURSE_SLUGS.map(loadCourse));
}
