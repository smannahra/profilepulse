import { format } from "date-fns";
import Link from "next/link";
import {
  TrendingUp,
  Lightbulb,
  Download,
  RefreshCw,
  Zap,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const USER_ID = 1;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function getDashboardStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [topicCount, ideaCount, lastImport] = await Promise.all([
    prisma.suggestion.count({
      where: { userId: USER_ID, type: "TOPIC", createdAt: { gte: todayStart } },
    }),
    prisma.suggestion.count({
      where: { userId: USER_ID, type: "IDEA", createdAt: { gte: todayStart } },
    }),
    prisma.post.findFirst({
      where: { userId: USER_ID, source: "IMPORT" },
      orderBy: { postedAt: "desc" },
      select: { postedAt: true },
    }),
  ]);

  return { topicCount, ideaCount, lastImport };
}

export default async function DashboardPage() {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const { topicCount, ideaCount, lastImport } = await getDashboardStats();

  const lastImportLabel = lastImport
    ? format(new Date(lastImport.postedAt), "MMM d, yyyy")
    : "—";
  const lastImportDesc = lastImport
    ? "most recent imported post"
    : "No LinkedIn export imported yet";

  const statCards = [
    {
      title: "Trends Today",
      value: topicCount > 0 ? String(topicCount) : "—",
      description:
        topicCount > 0
          ? "topics trending in your industry"
          : "Click Refresh Trends to generate",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "New Post Ideas",
      value: ideaCount > 0 ? String(ideaCount) : "—",
      description:
        ideaCount > 0
          ? "AI-generated ideas ready to review"
          : "Click Generate Ideas to create some",
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Last Import",
      value: lastImportLabel,
      description: lastImportDesc,
      icon: Download,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{getGreeting()} 👋</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-md p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/trends"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Trends
          </Link>
          <Link
            href="/dashboard/post-ideas"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Zap className="h-4 w-4" />
            Generate Posts
          </Link>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload LinkedIn Export
          </Link>
        </div>
      </div>
    </div>
  );
}
