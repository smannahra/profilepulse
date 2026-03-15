/**
 * lib/arxiv.ts
 * Fetches recent research papers from the public arXiv API (no key required).
 * Parses the Atom XML response using string extraction — no XML library needed.
 */

export type ArxivPaper = {
  title: string;
  summary: string;
  authors: string[];
  publishedAt: string;
  url: string;
  category: string;
};

// ---------------------------------------------------------------------------
// XML string helpers
// ---------------------------------------------------------------------------

function htmlDecode(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract the text content of the first occurrence of <tag ...>content</tag>. */
function extractTag(xml: string, tag: string): string {
  // Matches both <tag> and <tag type="..."> variants
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? htmlDecode(m[1].trim()) : "";
}

/** Extract all text contents for every occurrence of <tag>...</tag>. */
function extractAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(htmlDecode(m[1].trim()));
  }
  return results;
}

/** Extract an attribute value from the first matching tag. */
function extractAttr(xml: string, tagPattern: string, attr: string): string {
  const re = new RegExp(`<${tagPattern}[^>]*${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

/** Split the Atom feed XML into individual <entry>...</entry> strings. */
function splitEntries(xml: string): string[] {
  const entries: string[] = [];
  let cursor = 0;
  while (true) {
    const start = xml.indexOf("<entry>", cursor);
    if (start === -1) break;
    const end = xml.indexOf("</entry>", start);
    if (end === -1) break;
    entries.push(xml.slice(start, end + "</entry>".length));
    cursor = end + "</entry>".length;
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch recent papers from arXiv for the given keywords.
 *
 * @param keywords  Array of topic strings (e.g. ["machine learning", "LLMs"])
 * @param maxResults  How many papers to fetch (default 5)
 */
export async function fetchArxivPapers(
  keywords: string[],
  maxResults = 5
): Promise<ArxivPaper[]> {
  if (keywords.length === 0) return [];

  // Build query — use up to 3 keywords to keep it focused
  const query = keywords
    .slice(0, 3)
    .map((k) => `all:${encodeURIComponent(k.trim().replace(/\s+/g, "+"))}`)
    .join("+AND+");

  const url = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;

  console.log("[ProfilePulse] Fetching arXiv papers:", url);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/atom+xml" },
      // 12-second timeout — arXiv can be slow
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      console.error("[ProfilePulse] arXiv HTTP error:", res.status);
      return [];
    }

    const xml = await res.text();
    const entries = splitEntries(xml);
    console.log(`[ProfilePulse] arXiv returned ${entries.length} entries`);

    const papers: ArxivPaper[] = entries
      .map((entry): ArxivPaper | null => {
        const title = extractTag(entry, "title");
        if (!title) return null;

        // arXiv IDs look like: http://arxiv.org/abs/2401.12345v2
        // Strip version suffix so the URL always points to the latest
        const idRaw = extractTag(entry, "id");
        const paperUrl = idRaw.replace(/v\d+$/, "").replace("http://", "https://");
        if (!paperUrl) return null;

        const summary = extractTag(entry, "summary").slice(0, 600);
        const authorNames = extractAllTags(entry, "name").slice(0, 3);
        const publishedAt = extractTag(entry, "published");

        // Primary category — may appear as <arxiv:primary_category term="cs.LG"/>
        // or <category term="cs.LG" scheme="http://arxiv.org/schemas/atom"/>
        const category =
          extractAttr(entry, "arxiv:primary_category", "term") ||
          extractAttr(entry, "category", "term") ||
          "Unknown";

        return {
          title,
          summary,
          authors: authorNames,
          publishedAt,
          url: paperUrl,
          category,
        };
      })
      .filter((p): p is ArxivPaper => p !== null);

    if (papers.length > 0) {
      console.log("[ProfilePulse] First arXiv result:", papers[0].title);
    }

    return papers;
  } catch (err) {
    console.error("[ProfilePulse] arXiv fetch error:", err);
    return [];
  }
}
