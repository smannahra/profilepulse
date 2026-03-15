import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const MOCK_TRENDS = [
  {
    id: 1,
    title: "Agentic AI and Autonomous Pipelines",
    why: "Multiple frontier model releases and enterprise deployments in the past 72 hours have sparked debate about production readiness.",
    relevance: 97,
  },
  {
    id: 2,
    title: "Real-Time Feature Engineering",
    why: "Confluent and Databricks both published major blog posts on streaming feature stores, generating high engagement from data engineers.",
    relevance: 91,
  },
  {
    id: 3,
    title: "LLM Evaluation Frameworks",
    why: "The release of two open-source evals libraries triggered a flurry of LinkedIn posts comparing approaches to model quality assurance.",
    relevance: 88,
  },
  {
    id: 4,
    title: "Data Contracts in Production",
    why: "A viral post about a data quality incident reignited the debate around enforcing data contracts upstream.",
    relevance: 82,
  },
  {
    id: 5,
    title: "Python 3.13 Performance Gains",
    why: "Benchmarks showing 2x improvements in certain workloads are generating discussion in the data science community.",
    relevance: 76,
  },
  {
    id: 6,
    title: "Responsible AI Governance",
    why: "New EU AI Act compliance deadlines approaching. Compliance teams and AI practitioners are both posting heavily.",
    relevance: 74,
  },
  {
    id: 7,
    title: "Open-Source LLM Fine-Tuning",
    why: "Mistral and Meta releases this week lowered the barrier to custom models, sparking tutorials and opinions.",
    relevance: 70,
  },
  {
    id: 8,
    title: "SQL vs NoSQL in 2026",
    why: "A recurring debate resurged after a popular engineer posted a thread on choosing databases for ML workloads.",
    relevance: 65,
  },
];

function relevanceBadgeVariant(score: number) {
  if (score >= 90) return "default";
  if (score >= 75) return "secondary";
  return "outline";
}

function relevanceLabel(score: number) {
  if (score >= 90) return "High";
  if (score >= 75) return "Medium";
  return "Low";
}

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trends Today</h1>
          <p className="text-muted-foreground mt-1">
            Topics currently trending in the Data Science &amp; AI space on
            LinkedIn — ranked by relevance to your profile.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 mt-1">
          <TrendingUp className="h-3 w-3" />
          Placeholder data
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground w-1/3">
                  Topic
                </th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                  Why It&apos;s Trending
                </th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground w-32">
                  Relevance
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRENDS.map((trend, i) => (
                <tr
                  key={trend.id}
                  className={i < MOCK_TRENDS.length - 1 ? "border-b" : ""}
                >
                  <td className="px-6 py-4 font-medium">{trend.title}</td>
                  <td className="px-6 py-4 text-muted-foreground leading-relaxed">
                    {trend.why}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-xs">{trend.relevance}</span>
                      <Badge variant={relevanceBadgeVariant(trend.relevance)}>
                        {relevanceLabel(trend.relevance)}
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <strong>Session 2:</strong> Live trend discovery will pull from LinkedIn
        trending topics and score them against your profile using AI.
      </p>
    </div>
  );
}
