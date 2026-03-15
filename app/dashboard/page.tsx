import { format } from "date-fns";
import { TrendingUp, Lightbulb, Download, RefreshCw, Zap, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const statCards = [
  {
    title: "Trends Today",
    value: "8",
    description: "topics trending in your industry",
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "New Post Ideas",
    value: "5",
    description: "AI-generated ideas ready to review",
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    title: "Last Export Date",
    value: "—",
    description: "No LinkedIn export imported yet",
    icon: Download,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

export default function DashboardPage() {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

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
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Trends
          </Button>
          <Button variant="outline" className="gap-2">
            <Zap className="h-4 w-4" />
            Generate Posts
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload LinkedIn Export
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-dashed border-2 border-muted bg-transparent">
        <CardContent className="py-6 text-center text-muted-foreground">
          <p className="text-sm">
            This is your MVP dashboard. Data is currently placeholder — connect
            your LinkedIn export and configure your profile to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
