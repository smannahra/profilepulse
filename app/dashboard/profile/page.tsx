"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    headline: "",
    topics: "",
    targetAudience: "",
    postingGoal: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  async function handleSave() {
    // In Session 2 this will call a real API route to persist to the DB
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
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

          {/* Headline */}
          <div className="space-y-1.5">
            <Label htmlFor="headline">LinkedIn Headline</Label>
            <Input
              id="headline"
              name="headline"
              placeholder="e.g. Senior Data Scientist | ML Engineer | Speaker"
              value={form.headline}
              onChange={handleChange}
            />
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

          {/* Target Audience */}
          <div className="space-y-1.5">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              name="targetAudience"
              placeholder="e.g. Data leaders, ML engineers, tech recruiters"
              value={form.targetAudience}
              onChange={handleChange}
            />
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

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Profile
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

      <p className="text-xs text-muted-foreground">
        <strong>Session 2:</strong> This form will persist to the database and
        pre-populate from your saved profile.
      </p>
    </div>
  );
}
