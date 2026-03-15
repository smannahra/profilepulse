import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { buildProfileContext } from "@/lib/profile-context";

const USER_ID = 1;
const client = new Anthropic();

type OriginalIdea = {
  topic: string;
  hook: string;
  keyPoints: string[];
  cta: string;
};

type RepostSuggestion = {
  originalPost: string;
  commentSuggestion: string;
};

type PostIdeasResult = {
  originalIdeas: OriginalIdea[];
  repostSuggestions: RepostSuggestion[];
};

async function generatePostIdeasFromAI(
  profileContext: string
): Promise<PostIdeasResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a LinkedIn content strategist. Given this professional's profile, generate post ideas that will help them build their personal brand and achieve their goals.

${profileContext}

Generate:
1. THREE original post ideas (thought leadership posts they could write)
2. TWO repost suggestions (existing posts they could reshare with a comment)

Respond with ONLY a valid JSON object matching this exact structure, no markdown fences:
{
  "originalIdeas": [
    {
      "topic": "short topic name",
      "hook": "attention-grabbing opening sentence (1–2 sentences, first-person)",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "cta": "call to action question for the comments"
    }
  ],
  "repostSuggestions": [
    {
      "originalPost": "a realistic quote or excerpt from a post in their space that they could reshare",
      "commentSuggestion": "a substantive, opinionated comment they could add (2–4 sentences, first-person)"
    }
  ]
}

Make the ideas highly specific to their expertise, current trends, and goals. Avoid generic advice.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as PostIdeasResult;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      const profileContext = await buildProfileContext(USER_ID);
      const result = await generatePostIdeasFromAI(profileContext);

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
              cta: idea.cta,
            }),
            source: "AI-generated",
          },
        });
      }

      // Save REPOST suggestions
      for (const repost of result.repostSuggestions) {
        await prisma.suggestion.create({
          data: {
            userId: USER_ID,
            type: "REPOST",
            title: "Suggested Repost",
            body: JSON.stringify({
              originalPost: repost.originalPost,
              commentSuggestion: repost.commentSuggestion,
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
        const parsed = JSON.parse(s.body);
        return {
          topic: s.title,
          hook: parsed.hook ?? "",
          keyPoints: parsed.keyPoints ?? [],
          cta: parsed.cta ?? "",
        };
      } catch {
        return {
          topic: s.title,
          hook: s.body,
          keyPoints: [],
          cta: "",
        };
      }
    });

    const reposts: RepostSuggestion[] = repostSuggestions.map((s) => {
      try {
        const parsed = JSON.parse(s.body);
        return {
          originalPost: parsed.originalPost ?? "",
          commentSuggestion: parsed.commentSuggestion ?? "",
        };
      } catch {
        return {
          originalPost: s.title,
          commentSuggestion: s.body,
        };
      }
    });

    return NextResponse.json({
      originalIdeas,
      repostSuggestions: reposts,
    });
  } catch (error) {
    console.error("[GET /api/post-ideas]", error);
    return NextResponse.json(
      { error: "Failed to load post ideas" },
      { status: 500 }
    );
  }
}
