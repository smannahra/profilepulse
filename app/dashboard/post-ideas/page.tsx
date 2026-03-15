"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Repeat2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import type { OriginalIdea, RepostSuggestion, PostIdeasResult } from "@/app/api/post-ideas/route";

// ---------------------------------------------------------------------------
// Copy button (shared)
// ---------------------------------------------------------------------------

function CopyBtn({ text, label = "" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (label) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 h-7 px-2 text-xs"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {copied ? "Copied!" : label}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Source chip for "inspired by"
// ---------------------------------------------------------------------------

const SOURCE_CHIP: Record<string, string> = {
  NEWS:       "bg-blue-100 text-blue-700",
  TWITTER:    "bg-sky-100 text-sky-700",
  LINKEDIN:   "bg-indigo-100 text-indigo-700",
  HACKERNEWS: "bg-orange-100 text-orange-700",
  ARXIV:      "bg-purple-100 text-purple-700",
  WEB:        "bg-gray-100 text-gray-600",
};

function InspiredByChip({
  label,
  source,
}: {
  label: string;
  source: string;
}) {
  if (!label) return null;
  const colorClass = SOURCE_CHIP[source] ?? SOURCE_CHIP.WEB;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {source && source !== "AI-generated" ? `${source}: ` : ""}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PostIdeasPage() {
  const [data, setData] = useState<PostIdeasResult>({
    originalIdeas: [],
    repostSuggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIdeas = useCallback(async (refresh = false) => {
    if (refresh) setGenerating(true);
    else setLoading(true);
    setError(null);

    try {
      const url = refresh ? "/api/post-ideas?refresh=true" : "/api/post-ideas";
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load post ideas");
      }

      setData(json as PostIdeasResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load post ideas"
      );
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas(false);
  }, [loadIdeas]);

  const hasIdeas =
    data.originalIdeas.length > 0 || data.repostSuggestions.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post Ideas</h1>
          <p className="text-muted-foreground mt-1">
            AI-generated ideas grounded in today&apos;s signals. Copy, refine,
            and post manually on LinkedIn.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => loadIdeas(true)}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {generating ? "Generating…" : "Generate Ideas"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!hasIdeas && !error && (
        <Card className="border-dashed border-2 border-muted bg-transparent">
          <CardContent className="py-12 text-center space-y-3">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No ideas yet. Click <strong>Generate Ideas</strong> to get
              AI-powered post suggestions grounded in today&apos;s trends and
              research papers.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => loadIdeas(true)}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Generate Ideas
            </Button>
          </CardContent>
        </Card>
      )}

      {hasIdeas && (
        <>
          {/* -------------------------------------------------------------- */}
          {/* SECTION 1 — Original Post Ideas                                 */}
          {/* -------------------------------------------------------------- */}
          {data.originalIdeas.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold text-lg">Original Post Ideas</h2>
                <Badge variant="secondary">{data.originalIdeas.length}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.originalIdeas.map((idea, idx) => {
                  const hookText = idea.hook;
                  const fullText = [
                    idea.hook,
                    "",
                    ...(idea.keyPoints ?? []).map((p) => `• ${p}`),
                    "",
                    idea.callToAction,
                  ]
                    .filter((l) => l !== undefined)
                    .join("\n");

                  return (
                    <Card key={idx} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium leading-snug flex-1">
                            {idea.topic}
                          </CardTitle>
                          <CopyBtn text={fullText} />
                        </div>

                        {/* Inspired by chip */}
                        {idea.inspiredBy && (
                          <div className="mt-1">
                            <InspiredByChip
                              label={idea.inspiredBy}
                              source={idea.inspiredBySource}
                            />
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="flex-1 space-y-3 text-sm">
                        {/* Hook */}
                        {idea.hook && (
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Hook
                              </span>
                              <CopyBtn text={hookText} label="Copy Hook" />
                            </div>
                            <p className="mt-1 font-medium leading-snug">
                              {idea.hook}
                            </p>
                          </div>
                        )}

                        {/* Key Points */}
                        {(idea.keyPoints ?? []).length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Key Points
                            </span>
                            <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground leading-snug">
                              {(idea.keyPoints ?? []).map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Call to Action */}
                        {idea.callToAction && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Call to Action
                            </span>
                            <p className="mt-1 text-muted-foreground italic">
                              {idea.callToAction}
                            </p>
                          </div>
                        )}

                        {/* Why Now */}
                        {idea.whyNow && (
                          <div className="rounded-md bg-green-50 border border-green-200 px-2.5 py-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                              Why Post Now
                            </span>
                            <p className="mt-0.5 text-xs text-green-900 leading-snug">
                              {idea.whyNow}
                            </p>
                          </div>
                        )}

                        {/* Copy Full Post */}
                        <div className="pt-1">
                          <CopyBtn text={fullText} label="Copy Full Post" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* -------------------------------------------------------------- */}
          {/* SECTION 2 — What to Find & Repost                              */}
          {/* -------------------------------------------------------------- */}
          {data.repostSuggestions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Repeat2 className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold text-lg">
                  What to Find &amp; Repost
                </h2>
                <Badge variant="secondary">
                  {data.repostSuggestions.length}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {data.repostSuggestions.map((repost, idx) => (
                  <Card key={idx} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Repost Suggestion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-sm">
                      {/* What to find */}
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          What to Find
                        </span>
                        <CardDescription className="mt-1 text-sm leading-relaxed">
                          {repost.whatToFind}
                        </CardDescription>
                      </div>

                      {/* Where to search */}
                      {repost.whereToSearch && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Search className="h-3 w-3 shrink-0" />
                          <span>Search on: {repost.whereToSearch}</span>
                        </div>
                      )}

                      {/* Comment to add */}
                      {repost.commentToAdd && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Your Comment
                          </span>
                          <p className="mt-1 text-muted-foreground leading-relaxed">
                            {repost.commentToAdd}
                          </p>
                          <CopyBtn
                            text={repost.commentToAdd}
                            label="Copy Comment"
                          />
                        </div>
                      )}

                      {/* Why good for brand */}
                      {repost.whyGoodForBrand && (
                        <div className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Why This Builds Your Brand
                          </span>
                          <p className="mt-0.5 text-xs text-blue-900 leading-snug">
                            {repost.whyGoodForBrand}
                          </p>
                        </div>
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
