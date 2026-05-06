import type { Exercise } from "@/lib/types";

export function graderSystemPrompt(): string {
  return `You grade PE/finance practice exercises.

Output JSON: { "score": number (0-1), "feedback": string, "modelAnswer": string }

Rules:
- For numeric questions, compare to expectedAnswer with a 1% tolerance.
- For free-response, judge against the rubric. Award partial credit.
- Feedback: 2-3 sentences max. State what was right, what was wrong, the fix.
- modelAnswer: the canonical answer in <= 80 words.
- No emojis. No "good job".`;
}

export function graderUserPrompt(exercise: Exercise, response: string): string {
  return [
    `Exercise: ${exercise.prompt}`,
    `Type: ${exercise.type}`,
    exercise.expectedAnswer !== undefined
      ? `Expected: ${exercise.expectedAnswer}`
      : "",
    exercise.rubric ? `Rubric: ${exercise.rubric}` : "",
    "",
    `Learner response:`,
    response,
    "",
    "Grade now.",
  ]
    .filter(Boolean)
    .join("\n");
}
