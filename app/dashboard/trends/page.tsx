"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, RefreshCw, Loader2, AlertCircle } from "lucide-react";

type TrendItem = {
  title: string;
  why: string;
  relevance: number;
};

function relevanceBadgeVariant(
  score: number
): "default" | "secondary" | "outline" {
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
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrends = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = refresh ? "/api/trends?refresh=true" : "/api/trends";
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load trends");
      }

      setTrends(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trends");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrends(false);
  }, [loadTrends]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trends</h1>
          <p className="text-muted-foreground mt-1">
            Topics trending in your industry — ranked by relevance to your
            profile.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => loadTrends(true)}
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {refreshing ? "Refreshing…" : "Refresh Trends"}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : trends.length === 0 ? (
        <Card className="border-dashed border-2 border-muted bg-transparent">
          <CardContent className="py-12 text-center space-y-3">
            <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No trends yet. Click <strong>Refresh Trends</strong> to generate
              AI-powered trend analysis based on your profile.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => loadTrends(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generate Trends
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Trending Topics ({trends.length})
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
                {trends.map((trend, i) => (
                  <tr
                    key={trend.title}
                    className={i < trends.length - 1 ? "border-b" : ""}
                  >
                    <td className="px-6 py-4 font-medium">{trend.title}</td>
                    <td className="px-6 py-4 text-muted-foreground leading-relaxed">
                      {trend.why}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-xs">
                          {trend.relevance}
                        </span>
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
      )}
    </div>
  );
}
