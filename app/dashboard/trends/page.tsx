"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import type { TrendItem, ArxivSummary, TrendsResponse } from "@/app/api/trends/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SOURCE_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  NEWS:        { label: "News",       className: "bg-blue-100 text-blue-700 border-blue-200" },
  TWITTER:     { label: "Twitter/X",  className: "bg-sky-100 text-sky-700 border-sky-200" },
  LINKEDIN:    { label: "LinkedIn",   className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  HACKERNEWS:  { label: "HN",         className: "bg-orange-100 text-orange-700 border-orange-200" },
  WEB:         { label: "Web",        className: "bg-gray-100 text-gray-600 border-gray-200" },
  ARXIV:       { label: "arXiv",      className: "bg-purple-100 text-purple-700 border-purple-200" },
};

function SourceBadge({ source }: { source: string }) {
  const style = SOURCE_STYLES[source] ?? SOURCE_STYLES.WEB;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function RelevanceBadge({ score }: { score: number }) {
  if (score >= 90)
    return <Badge variant="default">{score}</Badge>;
  if (score >= 75)
    return <Badge variant="secondary">{score}</Badge>;
  return <Badge variant="outline">{score}</Badge>;
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function TrendSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-4/5 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ResearchSkeleton() {
  return (
    <div className="animate-pulse grid gap-4 sm:grid-cols-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [arxivPapers, setArxivPapers] = useState<ArxivSummary[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
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

      // Handle both new format { trends, arxivPapers, generatedAt }
      // and old flat-array format (legacy)
      if (Array.isArray(data)) {
        setTrends(data as TrendItem[]);
        setArxivPapers([]);
        setGeneratedAt(new Date().toISOString());
      } else {
        const typed = data as TrendsResponse;
        setTrends(typed.trends ?? []);
        setArxivPapers(typed.arxivPapers ?? []);
        setGeneratedAt(typed.generatedAt ?? new Date().toISOString());
      }
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

  const hasData = trends.length > 0 || arxivPapers.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trends</h1>
          <p className="text-muted-foreground mt-1">
            Live signals from the web + recent research papers — ranked by
            relevance to your profile.
          </p>
          {generatedAt && hasData && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated {timeAgo(generatedAt)}
            </p>
          )}
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <TrendSkeleton />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <ResearchSkeleton />
          </div>
        </div>
      ) : !hasData ? (
        /* Empty state */
        <Card className="border-dashed border-2 border-muted bg-transparent">
          <CardContent className="py-12 text-center space-y-3">
            <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No trends yet. Click <strong>Refresh Trends</strong> to fetch
              live signals from the web and recent research papers.
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
        <>
          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1 — Trending Now                                         */}
          {/* ---------------------------------------------------------------- */}
          {trends.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold text-lg">Trending Now</h2>
                <Badge variant="secondary">{trends.length}</Badge>
              </div>

              <div className="space-y-3">
                {trends.map((trend, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="pt-4 pb-4 space-y-2">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-sm leading-snug flex-1">
                          {trend.title}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <SourceBadge source={trend.source} />
                          <RelevanceBadge score={trend.relevance} />
                        </div>
                      </div>

                      {/* Why trending */}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {trend.why}
                      </p>

                      {/* Your angle */}
                      {trend.angle && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
                          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Your Angle
                          </span>
                          <p className="mt-0.5 text-amber-900 leading-snug">
                            {trend.angle}
                          </p>
                        </div>
                      )}

                      {/* Source detail */}
                      {trend.sourceDetail && (
                        <p className="text-xs text-muted-foreground">
                          {trend.sourceDetail}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2 — From Research                                        */}
          {/* ---------------------------------------------------------------- */}
          {arxivPapers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-purple-500" />
                <h2 className="font-semibold text-lg">From Research</h2>
                <Badge variant="secondary">{arxivPapers.length}</Badge>
                <span className="text-xs text-muted-foreground ml-1">
                  Recent papers from arXiv
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {arxivPapers.map((paper, i) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium leading-snug flex-1">
                          {paper.title}
                        </CardTitle>
                        <SourceBadge source="ARXIV" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-sm">
                      {/* Plain English summary */}
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          In Plain English
                        </span>
                        <p className="mt-1 text-muted-foreground leading-relaxed">
                          {paper.plainSummary}
                        </p>
                      </div>

                      {/* LinkedIn angle */}
                      {paper.linkedinAngle && (
                        <div className="rounded-md bg-purple-50 border border-purple-200 px-3 py-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                            LinkedIn Angle
                          </span>
                          <p className="mt-0.5 text-purple-900 text-sm leading-snug">
                            {paper.linkedinAngle}
                          </p>
                        </div>
                      )}

                      {/* Read paper link */}
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Read paper on arXiv
                        </a>
                      )}

                      {/* Published date */}
                      {paper.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          Published{" "}
                          {new Date(paper.publishedAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
