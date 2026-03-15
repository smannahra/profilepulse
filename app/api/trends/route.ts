import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { buildProfileContext } from "@/lib/profile-context";

const USER_ID = 1;
const client = new Anthropic();

type TrendItem = {
  title: string;
  why: string;
  relevance: number;
};

async function generateTrendsFromAI(
  profileContext: string
): Promise<TrendItem[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a LinkedIn trend analyst. Given this user's professional profile, identify 6–8 topics that are currently trending on LinkedIn that would be highly relevant to them.

${profileContext}

Respond with a JSON array of trend objects. Each object must have exactly these fields:
- "title": string — short topic name (3–8 words)
- "why": string — 1–2 sentences explaining why it's trending and why it's relevant to this user
- "relevance": number — relevance score 0–100 based on how closely it matches the user's expertise and goals

Return ONLY valid JSON array, no markdown fences, no extra text.

Example format:
[
  {
    "title": "Agentic AI in Production",
    "why": "Multiple major AI labs released autonomous coding agents this week, sparking debate about reliability and safety guardrails in production ML systems.",
    "relevance": 95
  }
]`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const trends: TrendItem[] = JSON.parse(cleaned);

  // Sort by relevance descending
  return trends.sort((a, b) => b.relevance - a.relevance);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      // Generate new trends via AI
      const profileContext = await buildProfileContext(USER_ID);
      const trends = await generateTrendsFromAI(profileContext);

      // Clear old TOPIC suggestions for this user
      await prisma.suggestion.deleteMany({
        where: { userId: USER_ID, type: "TOPIC" },
      });

      // Save new suggestions
      await prisma.suggestion.createMany({
        data: trends.map((t) => ({
          userId: USER_ID,
          type: "TOPIC" as const,
          title: t.title,
          body: t.why,
          source: `AI-relevance:${t.relevance}`,
        })),
      });

      return NextResponse.json(trends);
    }

    // Return cached TOPIC suggestions
    const suggestions = await prisma.suggestion.findMany({
      where: { userId: USER_ID, type: "TOPIC", dismissed: false },
      orderBy: { createdAt: "desc" },
    });

    const trends: TrendItem[] = suggestions.map((s) => {
      const relevanceMatch = s.source?.match(/AI-relevance:(\d+)/);
      return {
        title: s.title,
        why: s.body,
        relevance: relevanceMatch ? parseInt(relevanceMatch[1], 10) : 70,
      };
    });

    return NextResponse.json(trends);
  } catch (error) {
    console.error("[GET /api/trends]", error);
    return NextResponse.json(
      { error: "Failed to load trends" },
      { status: 500 }
    );
  }
}
