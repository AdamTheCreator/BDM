// Original lesson body content authored by Claude. NOT a copy of WSP's
// material — Claude writes its own explanation of the same concept.

export type LessonBodyContext = {
  courseTitle: string;
  courseDescription: string;
  chapterTitle: string;
  lessonTitle: string;
  lessonNumber: number;
  totalLessonsInCourse: number;
  prevLessonTitle?: string;
  nextLessonTitle?: string;
  // Case study companies the spec keeps consistent across lessons.
  caseStudy?: string;
};

export function lessonBodySystemPrompt(): string {
  return `You write original tutorial content for a self-paced PE/IB modeling course.
The learner is preparing for Business Development Manager roles at tech-focused
private equity firms. They're sharp, sales-engineering background, skeptical of
fluff.

Style:
- Direct, tutorial-voice. No filler ("In this lesson…", "Let's dive in", "By the end you'll").
- Use real WSP-style case-study companies (Apple for FSM/DCF, Apple-Disney for
  M&A, BMC for LBO, EXTR/CSCO/ANET/HPE/JNPR for trading comps, Brocade-Foundry
  /Extreme-Enterasys/HP-3COM/Thoma Bravo-Blue Coat for transaction comps) where
  it fits the lesson topic.
- Include concrete numerical examples where helpful.
- No emojis. No marketing language.
- Original explanations only — do NOT copy from WSP, BIWS, or any external
  source. Write the concept in your own words.

Output markdown with this structure:

## Overview
[1-2 sentences on what this lesson covers and why it matters in the modeling
workflow.]

## Key concepts
[3-5 bullets or short paragraphs on the substantive content. Include numerical
examples where appropriate.]

## Mechanics
[The specific formulas, Excel mechanics, or step-by-step process. Use code
blocks (\`\`\`) for formulas or Excel snippets when helpful.]

## Common mistakes
[2-3 specific errors learners make on this topic — be concrete.]

## What's next
[1 sentence connecting to the next lesson or chapter.]

Target length: 350-500 words. Lean toward specific over comprehensive.`;
}

export function lessonBodyUserPrompt(ctx: LessonBodyContext): string {
  return [
    `Course: ${ctx.courseTitle}`,
    `Course description: ${ctx.courseDescription}`,
    `Chapter: ${ctx.chapterTitle}`,
    `Lesson: ${ctx.lessonTitle} (lesson ${ctx.lessonNumber} of ${ctx.totalLessonsInCourse})`,
    ctx.prevLessonTitle ? `Previous lesson: ${ctx.prevLessonTitle}` : "Previous lesson: (this is the first lesson)",
    ctx.nextLessonTitle ? `Next lesson: ${ctx.nextLessonTitle}` : "Next lesson: (this is the last lesson)",
    ctx.caseStudy ? `Case study running through this course: ${ctx.caseStudy}` : "",
    "",
    "Write the lesson body now.",
  ]
    .filter(Boolean)
    .join("\n");
}
