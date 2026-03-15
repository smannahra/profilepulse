import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Upsert the default user (id = 1)
  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Your Name",
      email: "you@example.com",
      role: "Data Scientist",
      industry: "Technology",
      tone: "professional",
      topics: "Machine Learning,Python,Data Engineering,LLMs,MLOps",
      postingGoal:
        "Build a personal brand as a data science thought leader and grow professional network.",
    },
  });

  console.log(`Created/updated user: ${user.name} (id=${user.id})`);

  // Seed a few placeholder suggestions
  const suggestionCount = await prisma.suggestion.count({ where: { userId: 1 } });
  if (suggestionCount === 0) {
    await prisma.suggestion.createMany({
      data: [
        {
          userId: 1,
          type: "IDEA",
          title: "Write about Agentic AI Pitfalls",
          body: "Share 3 lessons learned from running LLM agents on real data.",
          source: "Trending: Agentic AI Pipelines",
        },
        {
          userId: 1,
          type: "TOPIC",
          title: "Data Contracts",
          body: "This topic is trending this week. Consider writing an opinion piece.",
          source: "Trend analysis",
        },
        {
          userId: 1,
          type: "REPOST",
          title: "Repost: Andrej Karpathy on data quality",
          body: "Repost with comment about your own experience with the 90/10 data-to-model ratio.",
          source: "LinkedIn trending",
        },
      ],
    });
    console.log("Created 3 placeholder suggestions.");
  }

  // Seed a placeholder activity log entry
  await prisma.activityLog.create({
    data: {
      userId: 1,
      action: "APP_INITIALIZED",
      metadata: JSON.stringify({ version: "0.1.0" }),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
