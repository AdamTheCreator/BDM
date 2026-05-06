/**
 * Daily deal-news ingestion. See spec §7.
 *
 * 1. Pull RSS / fetch top stories from each source (last 24h).
 * 2. Filter for tech / software / SaaS / tech-enabled services deals.
 * 3. Dedupe by target.
 * 4. For each, prompt Claude to extract acquirer, target, EV, multiple, thesis,
 *    and 3 learning questions.
 * 5. Write to content/deals/YYYY-MM-DD/<slug>.json.
 *
 * Wire to Vercel Cron once implemented.
 */
async function main() {
  console.log("refresh-deals: not yet implemented — see spec §7.");
}

main();
