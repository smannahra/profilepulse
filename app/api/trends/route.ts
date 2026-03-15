import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { buildProfileContext } from "@/lib/profile-context";
import { fetchArxivPapers } from "@/lib/arxiv";

const USER_ID = 1;
const client = new Anthropic();

// ---------------------------------------------------------------------------
// Shared types (also imported by post-ideas route)
// ---------------------------------------------------------------------------

export type TrendItem = {
  title: string;
  why: string;
  angle: string;
  relevance: number;
  source: string;       // NEWS | TWITTER | LINKEDIN | HACKERNEWS | WEB
  sourceDetail: string;
};

export type ArxivSummary = {
  title: string;
  plainSummary: string;
  linkedinAngle: string;
  url: string;
  publishedAt: string;
};

export type TrendsResponse = {
  trends: TrendItem[];
  arxivPapers: ArxivSummary[];
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip markdown fences and return parsed JSON, or null on failure. */
function parseJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract a JSON array or object from within the text
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch { /* fall through */ }
    }
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]) as T;
      } catch { /* fall through */ }
    }
    return null;
  }
}

/** Extract the last text block from a Claude response (web search may add tool_use blocks). */
function extractLastText(content: Anthropic.Messages.ContentBlock[]): string {
  const textBlocks = content.filter(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  if (textBlocks.length === 0) return "";
  return textBlocks[textBlocks.length - 1].text;
}

// ---------------------------------------------------------------------------
// Step 2a — web trend discovery via Claude + web_search
// ---------------------------------------------------------------------------

async function discoverWebTrends(profileContext: string): Promise<TrendItem[]> {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      // web_search_20250305 is a server-side built-in tool — Anthropic executes it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `You are a LinkedIn content intelligence engine.

Professional profile:
${profileContext}

Search the web and identify trending signals relevant to this professional from ALL of these sources:
1. LinkedIn trends and hashtags
2. X/Twitter discussions
3. Google News
4. Hacker News
5. Industry blogs or publications

Identify the 5 most relevant trending topics this person could post about RIGHT NOW.

Return ONLY a valid JSON array, no markdown fences, no extra text:
[
  {
    "title": "short topic name (3-8 words)",
    "why": "1-2 sentences on why it is trending right now",
    "angle": "the specific angle this professional should take when posting about it",
    "relevance": 85,
    "source": "NEWS",
    "sourceDetail": "brief attribution e.g. TechCrunch, HN front page, trending on LinkedIn"
  }
]

source must be exactly one of: NEWS | TWITTER | LINKEDIN | HACKERNEWS | WEB`,
        },
      ],
    });

    const text = extractLastText(response.content);
    const trends = parseJson<TrendItem[]>(text);
    console.log(
      `[ProfilePulse] Web trends discovered: ${trends?.length ?? 0}`
    );
    return trends ?? [];
  } catch (err) {
    console.error("[ProfilePulse] Web trend discovery failed:", err);
    // Fallback: call Claude without web search
    return discoverTrendsFallback(profileContext);
  }
}

/** Fallback trend discovery — used when web_search is unavailable. */
async function discoverTrendsFallback(
  profileContext: string
): Promise<TrendItem[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a LinkedIn trend analyst.

${profileContext}

Based on your knowledge of recent developments in this professional's field, identify 5 topics that are currently trending and highly relevant to them.

Return ONLY a valid JSON array, no markdown fences:
[
  {
    "title": "short topic name",
    "why": "1-2 sentences on why it is trending",
    "angle": "the angle this professional should take",
    "relevance": 85,
    "source": "WEB",
    "sourceDetail": "AI analysis"
  }
]`,
      },
    ],
  });

  const text = extractLastText(response.content);
  return parseJson<TrendItem[]>(text) ?? [];
}

// ---------------------------------------------------------------------------
// Step 3 — summarise arXiv papers for LinkedIn
// ---------------------------------------------------------------------------

async function summariseArxivPapers(
  papers: ReturnType<typeof fetchArxivPapers> extends Promise<infer T>
    ? T
    : never,
  profileContext: string
): Promise<ArxivSummary[]> {
  if (papers.length === 0) return [];

  const paperList = papers
    .map(
      (p, i) =>
        `${i + 1}. Title: ${p.title}\nAuthors: ${p.authors.join(", ")}\nCategory: ${p.category}\nAbstract: ${p.summary}`
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `These are recent research papers from arXiv:

${paperList}

Professional profile:
${profileContext}

For each paper, generate:
- plainSummary: one sentence explaining the paper in plain English, no jargon
- linkedinAngle: a specific LinkedIn post angle relevant to this professional based on this paper

Return ONLY a valid JSON array, no markdown fences:
[
  {
    "title": "exact paper title",
    "plainSummary": "one plain-English sentence anyone can understand",
    "linkedinAngle": "specific angle for a LinkedIn post this professional could write",
    "url": "paper url placeholder",
    "publishedAt": "published date placeholder"
  }
]`,
      },
    ],
  });

  const text = extractLastText(response.content);
  const summaries = parseJson<ArxivSummary[]>(text);
  if (!summaries) return [];

  // Merge back the real URL and published date from the fetched paper data
  return summaries.map((s, i) => ({
    title: s.title || papers[i]?.title || "",
    plainSummary: s.plainSummary || "",
    linkedinAngle: s.linkedinAngle || "",
    url: papers[i]?.url || s.url || "",
    publishedAt: papers[i]?.publishedAt || s.publishedAt || "",
  }));
}

// ---------------------------------------------------------------------------
// Full refresh — orchestrates all steps
// ---------------------------------------------------------------------------

async function performRefresh(): Promise<TrendsResponse> {
  const profileContext = await buildProfileContext(USER_ID);

  // Extract keywords from profile topics for arXiv query
  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  const keywords =
    user?.topics
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? ["artificial intelligence", "machine learning"];

  // Step 2: gather signals in parallel
  const [rawPapers, webTrends] = await Promise.all([
    fetchArxivPapers(keywords, 5),
    discoverWebTrends(profileContext),
  ]);

  // Step 3: summarise arXiv papers with a second Claude call
  const arxivSummaries = await summariseArxivPapers(rawPapers, profileContext);

  // Step 4: clear old TOPIC suggestions and save fresh ones
  await prisma.suggestion.deleteMany({
    where: { userId: USER_ID, type: "TOPIC" },
  });

  // Save web trends
  for (const trend of webTrends) {
    await prisma.suggestion.create({
      data: {
        userId: USER_ID,
        type: "TOPIC",
        title: trend.title,
        body: JSON.stringify({
          why: trend.why,
          angle: trend.angle,
          sourceDetail: trend.sourceDetail,
          relevance: trend.relevance,
        }),
        source: trend.source || "WEB",
      },
    });
  }

  // Save arXiv paper summaries
  for (const paper of arxivSummaries) {
    await prisma.suggestion.create({
      data: {
        userId: USER_ID,
        type: "TOPIC",
        title: paper.title,
        body: JSON.stringify({
          plainSummary: paper.plainSummary,
          linkedinAngle: paper.linkedinAngle,
          url: paper.url,
          publishedAt: paper.publishedAt,
        }),
        source: "ARXIV",
      },
    });
  }

  return {
    trends: webTrends,
    arxivPapers: arxivSummaries,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Parse suggestions from DB into TrendsResponse
// ---------------------------------------------------------------------------

function parseSuggestions(
  suggestions: {
    title: string;
    body: string;
    source: string | null;
    createdAt: Date;
  }[]
): TrendsResponse {
  const trends: TrendItem[] = [];
  const arxivPapers: ArxivSummary[] = [];
  let generatedAt = new Date().toISOString();

  for (const s of suggestions) {
    generatedAt = s.createdAt.toISOString();
    try {
      const parsed = JSON.parse(s.body);

      if (s.source === "ARXIV") {
        arxivPapers.push({
          title: s.title,
          plainSummary: parsed.plainSummary ?? "",
          linkedinAngle: parsed.linkedinAngle ?? "",
          url: parsed.url ?? "",
          publishedAt: parsed.publishedAt ?? "",
        });
      } else {
        trends.push({
          title: s.title,
          why: parsed.why ?? s.body,
          angle: parsed.angle ?? "",
          relevance: parsed.relevance ?? 70,
          source: s.source ?? "WEB",
          sourceDetail: parsed.sourceDetail ?? "",
        });
      }
    } catch {
      // Handle legacy plain-string body format from Session 2
      if (s.source !== "ARXIV") {
        const legacyRelevance = s.source?.match(/AI-relevance:(\d+)/);
        trends.push({
          title: s.title,
          why: s.body,
          angle: "",
          relevance: legacyRelevance ? parseInt(legacyRelevance[1], 10) : 70,
          source: "WEB",
          sourceDetail: "",
        });
      }
    }
  }

  return { trends, arxivPapers, generatedAt };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      const result = await performRefresh();
      return NextResponse.json(result);
    }

    // Load cached TOPIC suggestions from DB
    const suggestions = await prisma.suggestion.findMany({
      where: { userId: USER_ID, type: "TOPIC", dismissed: false },
      orderBy: { createdAt: "desc" },
    });

    // If nothing cached, trigger a refresh automatically
    if (suggestions.length === 0) {
      const result = await performRefresh();
      return NextResponse.json(result);
    }

    return NextResponse.json(parseSuggestions(suggestions));
  } catch (error) {
    console.error("[GET /api/trends]", error);
    return NextResponse.json(
      { error: "Failed to load trends" },
      { status: 500 }
    );
  }
}
