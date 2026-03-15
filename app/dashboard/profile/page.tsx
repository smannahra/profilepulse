"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, CheckCircle, Loader2 } from "lucide-react";

type ProfileForm = {
  name: string;
  role: string;
  industry: string;
  tone: string;
  topics: string;
  postingGoal: string;
};

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Conversational" },
  { value: "thought-leader", label: "Thought Leader" },
  { value: "storyteller", label: "Storyteller" },
  { value: "educational", label: "Educational" },
];

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    role: "",
    industry: "",
    tone: "professional",
    topics: "",
    postingGoal: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setForm({
            name: data.name ?? "",
            role: data.role ?? "",
            industry: data.industry ?? "",
            tone: data.tone ?? "professional",
            topics: data.topics ?? "",
            postingGoal: data.postingGoal ?? "",
          });
        }
      } catch {
        // If loading fails, just show the empty form
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save profile");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Setup</h1>
        <p className="text-muted-foreground mt-1">
          Tell ProfilePulse about yourself so it can generate relevant insights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your LinkedIn Identity</CardTitle>
          <CardDescription>
            This information shapes all AI suggestions and trend analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Alex Johnson"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          {/* Role / Headline */}
          <div className="space-y-1.5">
            <Label htmlFor="role">LinkedIn Headline / Role</Label>
            <Input
              id="role"
              name="role"
              placeholder="e.g. Senior Data Scientist | ML Engineer | Speaker"
              value={form.role}
              onChange={handleChange}
            />
          </div>

          {/* Industry / Target Audience */}
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry / Target Audience</Label>
            <Input
              id="industry"
              name="industry"
              placeholder="e.g. Technology, Data leaders, ML engineers"
              value={form.industry}
              onChange={handleChange}
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label htmlFor="tone">Writing Tone</Label>
            <select
              id="tone"
              name="tone"
              value={form.tone}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Topics */}
          <div className="space-y-1.5">
            <Label htmlFor="topics">Areas of Expertise</Label>
            <Textarea
              id="topics"
              name="topics"
              placeholder="e.g. Machine Learning, Python, Data Engineering, LLMs (comma-separated)"
              rows={3}
              value={form.topics}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Separate topics with commas. These drive trend relevance scoring.
            </p>
          </div>

          {/* Posting Goal */}
          <div className="space-y-1.5">
            <Label htmlFor="postingGoal">Professional Goal on LinkedIn</Label>
            <Textarea
              id="postingGoal"
              name="postingGoal"
              placeholder="e.g. Build personal brand as a data science thought leader, attract consulting clients, grow network to 5k followers"
              rows={3}
              value={form.postingGoal}
              onChange={handleChange}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Profile"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Saved successfully
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
