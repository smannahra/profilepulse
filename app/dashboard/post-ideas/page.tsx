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
import { Zap, Repeat2, Copy, Loader2, AlertCircle, RefreshCw } from "lucide-react";

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 -mr-1"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="text-xs text-green-600">✓</span>
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post Ideas</h1>
          <p className="text-muted-foreground mt-1">
            AI-generated content ideas tailored to your expertise and trending
            topics. Copy, refine, and post manually.
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

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!hasIdeas && !error ? (
        <Card className="border-dashed border-2 border-muted bg-transparent">
          <CardContent className="py-12 text-center space-y-3">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No ideas yet. Click <strong>Generate Ideas</strong> to get
              AI-powered post suggestions based on your profile and trending
              topics.
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
      ) : (
        <>
          {/* Original Post Ideas */}
          {data.originalIdeas.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold text-lg">Original Post Ideas</h2>
                <Badge variant="secondary">{data.originalIdeas.length}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.originalIdeas.map((idea, idx) => {
                  const fullText = `${idea.hook}\n\n${idea.keyPoints.map((p) => `• ${p}`).join("\n")}\n\n${idea.cta}`;
                  return (
                    <Card key={idx} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium leading-tight">
                            {idea.topic}
                          </CardTitle>
                          <CopyButton text={fullText} />
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-3 text-sm">
                        {idea.hook && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Hook
                            </span>
                            <p className="mt-1 font-medium leading-snug">
                              {idea.hook}
                            </p>
                          </div>
                        )}
                        {idea.keyPoints.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Key Points
                            </span>
                            <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground leading-snug">
                              {idea.keyPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {idea.cta && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Call to Action
                            </span>
                            <p className="mt-1 text-muted-foreground italic">
                              {idea.cta}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Repost Suggestions */}
          {data.repostSuggestions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Repeat2 className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold text-lg">Repost Suggestions</h2>
                <Badge variant="secondary">
                  {data.repostSuggestions.length}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {data.repostSuggestions.map((repost, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Suggested Repost
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {repost.originalPost}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Your Comment Suggestion
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {repost.commentSuggestion}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 -ml-2 mt-1"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            repost.commentSuggestion
                          )
                        }
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Comment
                      </Button>
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
