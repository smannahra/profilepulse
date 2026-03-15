import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { buildProfileContext } from "@/lib/profile-context";
import type { TrendItem, ArxivSummary } from "@/app/api/trends/route";

const USER_ID = 1;
const client = new Anthropic();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OriginalIdea = {
  topic: string;
  hook: string;
  keyPoints: string[];
  callToAction: string;
  inspiredBy: string;
  inspiredBySource: string;
  whyNow: string;
};

export type RepostSuggestion = {
  whatToFind: string;
  whereToSearch: string;
  commentToAdd: string;
  whyGoodForBrand: string;
};

export type PostIdeasResult = {
  originalIdeas: OriginalIdea[];
  repostSuggestions: RepostSuggestion[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
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

function extractLastText(content: Anthropic.Messages.ContentBlock[]): string {
  const textBlocks = content.filter(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  if (textBlocks.length === 0) return "";
  return textBlocks[textBlocks.length - 1].text;
}

// ---------------------------------------------------------------------------
// Step 1 — load trend signals from DB
// ---------------------------------------------------------------------------

async function loadSignals(): Promise<{
  trends: TrendItem[];
  arxivPapers: ArxivSummary[];
}> {
  const suggestions = await prisma.suggestion.findMany({
    where: { userId: USER_ID, type: "TOPIC", dismissed: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const trends: TrendItem[] = [];
  const arxivPapers: ArxivSummary[] = [];

  for (const s of suggestions) {
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
      if (s.source !== "ARXIV") {
        trends.push({
          title: s.title,
          why: s.body,
          angle: "",
          relevance: 70,
          source: s.source ?? "WEB",
          sourceDetail: "",
        });
      }
    }
  }

  return { trends, arxivPapers };
}

// ---------------------------------------------------------------------------
// Step 2 — generate grounded post ideas via Claude
// ---------------------------------------------------------------------------

async function generateGroundedIdeas(
  profileContext: string,
  trends: TrendItem[],
  arxivPapers: ArxivSummary[]
): Promise<PostIdeasResult> {
  const trendLines =
    trends.length > 0
      ? trends
          .map(
            (t) =>
              `- [${t.source}] "${t.title}": ${t.why}${t.angle ? ` Angle: ${t.angle}` : ""}`
          )
          .join("\n")
      : "No trending signals available — draw on your general knowledge.";

  const paperLines =
    arxivPapers.length > 0
      ? arxivPapers
          .map(
            (p) =>
              `- [ARXIV] "${p.title}": ${p.plainSummary}${p.linkedinAngle ? ` Angle: ${p.linkedinAngle}` : ""}`
          )
          .join("\n")
      : "No recent research papers available.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3500,
    messages: [
      {
        role: "user",
        content: `You are a LinkedIn ghostwriter helping a professional build their personal brand.

Professional profile:
${profileContext}

Trending signals today:
${trendLines}

Recent research papers:
${paperLines}

Generate exactly:
- 3 ORIGINAL POST IDEAS grounded in the signals above
- 2 REPOST SUGGESTIONS telling them what content to find and reshare

Return ONLY a valid JSON object, no markdown fences:
{
  "originalIdeas": [
    {
      "topic": "short topic name (3-6 words)",
      "hook": "attention-grabbing opening sentence (first-person, 1-2 sentences)",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "callToAction": "question or prompt inviting comments",
      "inspiredBy": "the trend title or paper title that inspired this idea",
      "inspiredBySource": "NEWS | TWITTER | LINKEDIN | HACKERNEWS | WEB | ARXIV",
      "whyNow": "one sentence on why this topic is timely to post about right now"
    }
  ],
  "repostSuggestions": [
    {
      "whatToFind": "description of the post or content to search for and reshare",
      "whereToSearch": "LinkedIn | Twitter | Google News | Hacker News",
      "commentToAdd": "substantive comment to write when resharing (2-4 sentences, first-person, opinionated)",
      "whyGoodForBrand": "one sentence on why resharing this builds their personal brand"
    }
  ]
}

Be specific and grounded in the signals provided. Avoid generic career advice.`,
      },
    ],
  });

  const text = extractLastText(response.content);
  const result = parseJson<PostIdeasResult>(text);

  if (!result) {
    throw new Error("Claude returned unparseable post ideas response");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      const profileContext = await buildProfileContext(USER_ID);
      const { trends, arxivPapers } = await loadSignals();
      const result = await generateGroundedIdeas(
        profileContext,
        trends,
        arxivPapers
      );

      // Clear old IDEA and REPOST suggestions
      await prisma.suggestion.deleteMany({
        where: { userId: USER_ID, type: { in: ["IDEA", "REPOST"] } },
      });

      // Save IDEA suggestions
      for (const idea of result.originalIdeas) {
        await prisma.suggestion.create({
          data: {
            userId: USER_ID,
            type: "IDEA",
            title: idea.topic,
            body: JSON.stringify({
              hook: idea.hook,
              keyPoints: idea.keyPoints,
              callToAction: idea.callToAction,
              inspiredBy: idea.inspiredBy,
              inspiredBySource: idea.inspiredBySource,
              whyNow: idea.whyNow,
            }),
            source: idea.inspiredBySource || "AI-generated",
          },
        });
      }

      // Save REPOST suggestions
      for (const repost of result.repostSuggestions) {
        await prisma.suggestion.create({
          data: {
            userId: USER_ID,
            type: "REPOST",
            title: repost.whatToFind.slice(0, 100),
            body: JSON.stringify({
              whatToFind: repost.whatToFind,
              whereToSearch: repost.whereToSearch,
              commentToAdd: repost.commentToAdd,
              whyGoodForBrand: repost.whyGoodForBrand,
            }),
            source: "AI-generated",
          },
        });
      }

      return NextResponse.json(result);
    }

    // Return cached suggestions
    const ideaSuggestions = await prisma.suggestion.findMany({
      where: { userId: USER_ID, type: "IDEA", dismissed: false },
      orderBy: { createdAt: "desc" },
    });

    const repostSuggestions = await prisma.suggestion.findMany({
      where: { userId: USER_ID, type: "REPOST", dismissed: false },
      orderBy: { createdAt: "desc" },
    });

    const originalIdeas: OriginalIdea[] = ideaSuggestions.map((s) => {
      try {
        const p = JSON.parse(s.body);
        return {
          topic: s.title,
          hook: p.hook ?? "",
          keyPoints: p.keyPoints ?? [],
          // Support both old key "cta" and new key "callToAction"
          callToAction: p.callToAction ?? p.cta ?? "",
          inspiredBy: p.inspiredBy ?? "",
          inspiredBySource: p.inspiredBySource ?? "",
          whyNow: p.whyNow ?? "",
        };
      } catch {
        return {
          topic: s.title,
          hook: s.body,
          keyPoints: [],
          callToAction: "",
          inspiredBy: "",
          inspiredBySource: "",
          whyNow: "",
        };
      }
    });

    const reposts: RepostSuggestion[] = repostSuggestions.map((s) => {
      try {
        const p = JSON.parse(s.body);
        if (p.whatToFind) {
          return {
            whatToFind: p.whatToFind,
            whereToSearch: p.whereToSearch ?? "",
            commentToAdd: p.commentToAdd ?? "",
            whyGoodForBrand: p.whyGoodForBrand ?? "",
          };
        }
        // Legacy Session 2 format (originalPost / commentSuggestion)
        return {
          whatToFind: p.originalPost ?? s.title,
          whereToSearch: "LinkedIn",
          commentToAdd: p.commentSuggestion ?? "",
          whyGoodForBrand: "",
        };
      } catch {
        return {
          whatToFind: s.title,
          whereToSearch: "LinkedIn",
          commentToAdd: s.body,
          whyGoodForBrand: "",
        };
      }
    });

    return NextResponse.json({ originalIdeas, repostSuggestions: reposts });
  } catch (error) {
    console.error("[GET /api/post-ideas]", error);
    return NextResponse.json(
      { error: "Failed to load post ideas" },
      { status: 500 }
    );
  }
}
