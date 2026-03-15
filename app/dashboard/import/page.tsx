"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

type ImportResult = {
  imported: number;
  skipped: number;
  total: number;
};

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.toLowerCase().endsWith(".csv")) {
        setError("Only CSV files are supported.");
        return;
      }
      setFile(dropped);
      setResult(null);
      setError(null);
    }
  }

  function clearFile() {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      setResult(data as ImportResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import LinkedIn Data</h1>
        <p className="text-muted-foreground mt-1">
          Upload your LinkedIn posts export (CSV) to populate ProfilePulse with
          your real post history.
        </p>
      </div>

      {/* How to export */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800">
            How to export your LinkedIn data
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-1">
          <p>1. Go to LinkedIn → Me → Settings &amp; Privacy</p>
          <p>2. Click <strong>Data privacy</strong> → <strong>Get a copy of your data</strong></p>
          <p>3. Select <strong>Posts</strong> and request the archive</p>
          <p>4. Download the ZIP and extract the <strong>Shares.csv</strong> file</p>
        </CardContent>
      </Card>

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV File</CardTitle>
          <CardDescription>
            Drop your LinkedIn posts CSV file here or click to select.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          {!file ? (
            <div
              className="border-2 border-dashed border-muted rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Drag &amp; drop your CSV file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse — CSV only
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Import complete — <strong>{result.imported}</strong>{" "}
                post{result.imported !== 1 ? "s" : ""} imported,{" "}
                <strong>{result.skipped}</strong> skipped (duplicates or empty).
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Importing…" : "Import Posts"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ProfilePulse is <strong>read-only</strong> — your data stays local and
        is never sent to LinkedIn.
      </p>
    </div>
  );
}
