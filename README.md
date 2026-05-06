# Signal-PE

Self-hosted PE/BD learning platform. Mirrors the Wall Street Prep Premium Package
(7 courses, 438 lessons), adds the origination layer WSP doesn't teach
(thematic outbound, thesis writing, mock interviews, deal-news drills, firm
research), and tutors with Claude.

Architecturally modeled on Signal-Inference: Next.js 15 + Tailwind + Anthropic
SDK + Vercel.

## Status

| Area | Status |
|---|---|
| App skeleton + streaming Claude tutor | ✅ |
| 7 course manifests (chapter-level) | ✅ |
| Lesson seeding (per-lesson MDX with videos) | ⏳ needs WSP TOC text dumps + `YOUTUBE_API_KEY` |
| Lesson body MDX authoring | ⏳ slow incremental phase |
| Practice — paper LBO drill | ✅ |
| Practice — accretion / dilution drill | ✅ |
| Practice — thesis builder + Markdown export | ✅ |
| Practice — outbound composer | ✅ |
| Interviews — behavioral, technical, case | ✅ |
| Firm directory (15 firms + refresh) | ✅ |
| Deal feed | ✅ ingestion script; ⏳ runtime cron needs persistence layer |
| Progress dashboard | ✅ |

## Local setup

```bash
cp .env.example .env.local        # fill in ANTHROPIC_API_KEY
npm install
npm run dev
```

## Deal feed

`npm run refresh:deals` fetches RSS from PE Hub + Axios Pro Rata, asks Claude
to extract acquirer / target / EV / multiple / thesis + 3 drill questions per
deal, and writes JSON files into `content/deals/YYYY-MM-DD/`. Commit the new
files to source control; `/deals/feed` reads them at request time.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run refresh:deals
git add content/deals && git commit -m "Refresh deal feed"
```

**Vercel cron caveat.** Vercel's runtime filesystem is read-only, so a cron
pointed at `/api/cron/refresh-deals` can't write back to `content/deals/`.
To run the refresh from cron you need either Vercel KV / Blob for runtime
persistence, or a GitHub-API push back to the repo so the next deploy picks
up the new files. `vercel.json.example` shows the cron config; rename it to
`vercel.json` once you've wired one of those persistence paths.

## Phase 1–3 content pipeline

| Step | Command | Inputs needed |
|---|---|---|
| Lesson seeding | `npm run seed:courses` | `scripts/wsp-toc/<slug>.txt` per course (one line per lesson: `Chapter Title \| Lesson Title \| mm:ss`) |
| Video population | `npm run seed:videos` | `YOUTUBE_API_KEY` (Google Cloud, free tier) |
| Lesson body MDX | hand-authored, incrementally | the night before each lesson |

## Honest tradeoff

WSP costs $499 + ~70–90h of study. Signal-PE costs ~$0 in infra (Vercel free
tier + metered Anthropic) + 60–90h to build + the same study time. You don't
save effort. You **trade money for sovereignty over the curriculum** — and you
end up with a portfolio artifact and a tutor that adapts to you.

If your interview timeline is < 4 weeks, just buy WSP and skip the build.
