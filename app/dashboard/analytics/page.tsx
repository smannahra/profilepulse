"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const POSTS_PER_MONTH = [
  { month: "Aug", posts: 3 },
  { month: "Sep", posts: 5 },
  { month: "Oct", posts: 4 },
  { month: "Nov", posts: 7 },
  { month: "Dec", posts: 2 },
  { month: "Jan", posts: 6 },
  { month: "Feb", posts: 8 },
  { month: "Mar", posts: 5 },
];

const TOP_TOPICS = [
  { topic: "LLMs", avgLikes: 142 },
  { topic: "Python", avgLikes: 98 },
  { topic: "Data Eng", avgLikes: 87 },
  { topic: "MLOps", avgLikes: 74 },
  { topic: "Career", avgLikes: 203 },
  { topic: "AI Tools", avgLikes: 119 },
];

const CONSISTENCY_DATA = [
  { week: "W1 Jan", posted: 1 },
  { week: "W2 Jan", posted: 2 },
  { week: "W3 Jan", posted: 0 },
  { week: "W4 Jan", posted: 1 },
  { week: "W1 Feb", posted: 2 },
  { week: "W2 Feb", posted: 3 },
  { week: "W3 Feb", posted: 1 },
  { week: "W4 Feb", posted: 2 },
];

const RADAR_DATA = [
  { skill: "Consistency", score: 72 },
  { skill: "Engagement", score: 85 },
  { skill: "Reach", score: 60 },
  { skill: "Topics", score: 90 },
  { skill: "Frequency", score: 55 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Visual insights into your LinkedIn posting patterns and performance.
          </p>
        </div>
        <Badge variant="secondary">Placeholder data</Badge>
      </div>

      {/* Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Posts per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts Per Month</CardTitle>
            <CardDescription>
              How many posts you published each month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={POSTS_PER_MONTH} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="posts" fill="hsl(221.2 83.2% 53.3%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Best Performing Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best Performing Topics</CardTitle>
            <CardDescription>Average likes by topic category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={TOP_TOPICS}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="topic" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip />
                <Bar dataKey="avgLikes" fill="hsl(142.1 76.2% 36.3%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Posting Consistency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posting Consistency</CardTitle>
            <CardDescription>
              Posts per week — aim for at least 2/week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={CONSISTENCY_DATA}
                margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 4]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="posted"
                  stroke="hsl(262.1 83.3% 57.8%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profile Score Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Activity Score</CardTitle>
            <CardDescription>
              Composite score across key activity dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <Radar
                  dataKey="score"
                  stroke="hsl(221.2 83.2% 53.3%)"
                  fill="hsl(221.2 83.2% 53.3%)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Session 2:</strong> Charts will populate with real data from
        your LinkedIn export and calculated engagement metrics.
      </p>
    </div>
  );
}
