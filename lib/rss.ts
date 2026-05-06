// Minimal RSS / Atom parser. Avoids a dependency.
// Handles standard <item>/<entry> shapes with CDATA-wrapped fields.

export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
};

export function parseRss(xml: string): RssItem[] {
  // RSS 2.0 uses <item>; Atom uses <entry>.
  const itemRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  const matches = xml.match(itemRe) ?? [];
  return matches.map(parseItem).filter((i): i is RssItem => i !== null);
}

function parseItem(block: string): RssItem | null {
  const title = extractTag(block, "title");
  const link = extractLink(block);
  const description =
    extractTag(block, "content:encoded") ||
    extractTag(block, "description") ||
    extractTag(block, "summary") ||
    "";
  const pubDate =
    extractTag(block, "pubDate") || extractTag(block, "updated") || extractTag(block, "published");

  if (!title || !link) return null;
  return { title: cleanText(title), link, description: cleanText(description), pubDate: pubDate || undefined };
}

function extractTag(block: string, tag: string): string {
  // Match <tag>...</tag> or <tag attr="...">...</tag>, with optional CDATA.
  const re = new RegExp(`<${escapeRe(tag)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeRe(tag)}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : raw;
}

function extractLink(block: string): string {
  // Atom: <link href="..." />
  const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return atom[1];
  // RSS: <link>https://...</link>
  return extractTag(block, "link");
}

function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
