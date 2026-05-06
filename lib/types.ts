// Data model — see spec §3.3.

export type CourseSlug =
  | "financial-statement-modeling"
  | "dcf-modeling"
  | "ma-modeling"
  | "trading-comps"
  | "transaction-comps"
  | "lbo-modeling"
  | "building-buyers-lists";

export type Course = {
  slug: CourseSlug;
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  description: string;
  totalLessons: number;
  totalRuntimeMinutes: number;
  chapters: Chapter[];
};

export type Chapter = {
  slug: string;
  title: string;
  lessons: LessonRef[];
};

export type LessonRef = {
  slug: string;
  number: number;
  title: string;
  runtimeSeconds: number;
  type: "video" | "reading" | "exercise";
};

export type LessonFrontmatter = {
  course: CourseSlug;
  number: number;
  title: string;
  wspRuntimeSeconds: number;
  objectives: string[];
  prerequisites: string[];
  videos: VideoRef[];
  exercises: Exercise[];
  excelTemplates: string[];
  furtherReading: Link[];
};

export type VideoRef = {
  source: "youtube";
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number;
  startSeconds?: number;
  relevanceScore: number;
  notes: string;
};

export type Exercise = {
  id: string;
  prompt: string;
  type: "free-response" | "numeric" | "multiple-choice" | "model-build";
  rubric?: string;
  expectedAnswer?: string | number;
  hint?: string;
  choices?: string[];
};

export type Link = { title: string; url: string };

export type LessonProgress = {
  lessonSlug: string;
  status: "not-started" | "in-progress" | "completed";
  videoWatched: boolean;
  exercisesAttempted: string[];
  exerciseScores: Record<string, number>;
  lastVisitedAt: string;
  notes: string;
};

export type Firm = {
  slug: string;
  name: string;
  website: string;
  thesis: string;
  fundSize: string;
  checkSize: string;
  recentDeals: Deal[];
  bdTeam: TeamMember[];
  hiringSignals: string;
  lastRefreshedAt: string;
};

export type TeamMember = {
  name: string;
  title: string;
  linkedin?: string;
  background?: string;
};

export type Deal = {
  id: string;
  date: string;
  acquirer: string;
  target: string;
  ev?: number;
  evMultiple?: string;
  thesisSummary: string;
  source: string;
  questions: string[];
};

export type ThesisDraft = {
  id: string;
  target: string;
  industry: string;
  marketSize: string;
  businessModel: string;
  financialSnapshot: string;
  strategicFit: string;
  diligenceQuestions: string[];
  redFlags: string[];
  recommendation: "pursue" | "monitor" | "pass";
  rationale: string;
  createdAt: string;
};
