# Signal-PE

Self-hosted PE/BD learning platform. Mirrors the Wall Street Prep Premium Package
(7 courses, 438 lessons), adds the origination layer WSP doesn't teach
(thematic outbound, thesis writing, mock interviews, deal-news drills, firm
research), and tutors with Claude.

Architecturally modeled on Signal-Inference: Next.js 15 + Tailwind + Anthropic
SDK + Vercel.

## What's in this repo so far

This is the **Phase 0–2 skeleton** from the spec (see `SPEC.md`). What's wired:

- Next.js 15 (App Router) + TypeScript + Tailwind
- Anthropic SDK wrapper with streaming (`lib/anthropic.ts`)
- `/api/chat` streaming tutor endpoint
- Prompt templates for tutor / thesis / outbound / behavioral / technical / grader
- 7 course manifests with the chapter structure from spec §2.1 + Appendix A
- `/learn`, `/learn/[courseSlug]`, `/learn/[courseSlug]/[lessonSlug]` pages
- `<TutorChat>` client component with streaming
- Stub routes for practice / interviews / deals / firms / progress
- `scripts/seed-courses.ts` — populate lessons from a WSP TOC text dump
- `scripts/seed-videos.ts` — find + Claude-score YouTube videos per lesson
- `scripts/refresh-deals.ts` — daily PE deal cron stub
- `lib/types.ts` — full data model from spec §3.3
- `lib/storage.ts` — localStorage progress adapter (KV swap-in later)

## What still needs work (from the spec)

| Phase | Item | Hours |
|---|---|---|
| 1 | Drop WSP TOCs into `scripts/wsp-toc/<slug>.txt` and run `npm run seed:courses` | 2 |
| 2 | Get YOUTUBE_API_KEY, run `npm run seed:videos`, spot-check + manually fix bad picks | 6 |
| 3 | Author lesson body MDX (438 lessons; can be incremental, night-before each lesson) | 20–30 |
| 4 | Build practice modules (paper LBO, A/D, thesis builder, outbound) — full UI | 12–16 |
| 4 | Build interview modules (behavioral, technical, case) — full UI + grading flow | included above |
| 5 | Wire deal-news ingestion + Vercel Cron; hand-author 15 firm profiles | 8–12 |
| 6 | Mastery scoring math, spaced repetition queue, progress dashboard, artifact gallery | 4–8 |

Total realistic effort to v1-complete: 60–90 focused hours.

## Local setup

```bash
cp .env.example .env.local        # then fill in ANTHROPIC_API_KEY
npm install
npm run dev
```

## Deploy

Push to a Vercel project pointed at this repo. Add env vars in the Vercel
dashboard. No DB needed in v1 — progress lives in localStorage.

## Honest tradeoff

WSP costs $499 + ~70–90h of study. Signal-PE costs ~$0 in infra (Vercel free
tier + metered Anthropic) + 60–90h to build + the same study time. You don't
save effort. You **trade money for sovereignty over the curriculum** — and you
end up with a portfolio artifact and a tutor that adapts to you.

If your interview timeline is < 4 weeks, just buy WSP and skip the build.
