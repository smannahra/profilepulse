import { prisma } from "./prisma";

/**
 * Builds a formatted profile context string for use in AI prompts.
 * Reads the User record from the database and returns structured text
 * describing who the user is, their goals, tone, and topics.
 */
export async function buildProfileContext(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return "No user profile found. Please set up your profile first.";
  }

  const topicList = user.topics
    ? user.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ")
    : "none specified";

  return `
User Profile:
- Name: ${user.name}
- Role / Headline: ${user.role}
- Industry: ${user.industry}
- Writing Tone: ${user.tone}
- Core Topics: ${topicList}
- Posting Goal: ${user.postingGoal ?? "not specified"}
`.trim();
}
