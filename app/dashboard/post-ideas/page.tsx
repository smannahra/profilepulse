import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Repeat2, Copy } from "lucide-react";

const ORIGINAL_IDEAS = [
  {
    id: 1,
    topic: "Agentic AI Pipelines",
    hook: "I ran an autonomous agent on a 2M-row dataset last week. Here is what I learned the hard way.",
    keyPoints: [
      "Agents amplify data quality issues — garbage in, autonomous garbage out",
      "Memory management is the hidden bottleneck no one talks about",
      "Human-in-the-loop checkpoints are not optional for production workflows",
    ],
    cta: "What guardrails have you built into your agentic systems? Drop them below.",
  },
  {
    id: 2,
    topic: "Data Contracts",
    hook: "Your data pipeline has a silent killer. It is called 'assumed schema'.",
    keyPoints: [
      "3 production incidents in our team were caused by undocumented column changes",
      "Data contracts catch breaking changes before they hit analytics",
      "The best contract is one the upstream team owns and versioned in Git",
    ],
    cta: "Are you enforcing data contracts yet? I am curious about your setup.",
  },
  {
    id: 3,
    topic: "LLM Evaluation",
    hook: "Everyone is shipping AI features. Almost nobody is measuring if they actually work.",
    keyPoints: [
      "LGTM evals ('looks good to me') are not a strategy",
      "LLM-as-judge is fast but requires calibration against human labels",
      "Regression testing on a golden dataset is still the gold standard",
    ],
    cta: "Which evals framework are you using? Let me know in the comments.",
  },
];

const REPOST_SUGGESTIONS = [
  {
    id: 1,
    originalPost:
      "\"The real bottleneck in most ML teams isn't compute — it's clean, labelled data. We spent 3 months building a model, and 6 months cleaning the training set.\" — Andrej Karpathy",
    commentSuggestion:
      "This maps exactly to every data science project I have worked on. The 80/20 rule is a myth — it is closer to 90% data and 10% model for production systems. The teams that invest in data quality pipelines early almost always outperform those that don't. What is the data:model effort split on your current project?",
  },
  {
    id: 2,
    originalPost:
      "\"Python is eating data engineering. But Rust is eating Python.\" — popular LinkedIn post with 12k reactions",
    commentSuggestion:
      "Partially agree. Rust is undeniably faster and safer for systems-level data tooling — Polars and DeltaRS are proof. But Python's ecosystem and talent pool will keep it dominant for orchestration and ML for the next 5+ years. The real story is polyglot data stacks, not replacement.",
  },
];

export default function PostIdeasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Post Ideas</h1>
        <p className="text-muted-foreground mt-1">
          AI-generated content ideas tailored to your expertise and trending
          topics. Copy, refine, and post manually.
        </p>
      </div>

      {/* Original Post Ideas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold text-lg">Original Post Ideas</h2>
          <Badge variant="secondary">{ORIGINAL_IDEAS.length}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ORIGINAL_IDEAS.map((idea) => (
            <Card key={idea.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-tight">
                    {idea.topic}
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Hook
                  </span>
                  <p className="mt-1 font-medium leading-snug">{idea.hook}</p>
                </div>
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
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Call to Action
                  </span>
                  <p className="mt-1 text-muted-foreground italic">
                    {idea.cta}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Repost Suggestions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Repeat2 className="h-4 w-4 text-blue-500" />
          <h2 className="font-semibold text-lg">Repost Suggestions</h2>
          <Badge variant="secondary">{REPOST_SUGGESTIONS.length}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {REPOST_SUGGESTIONS.map((repost) => (
            <Card key={repost.id}>
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
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mt-1">
                  <Copy className="h-3.5 w-3.5" />
                  Copy Comment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        <strong>Session 2:</strong> Ideas will be generated live by Claude using
        your profile and today&apos;s trending topics.
      </p>
    </div>
  );
}
