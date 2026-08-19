"use client";

import { useState } from "react";
import { ResumeUploader } from "@/components/ResumeUploader";
import { ResultsTable } from "@/components/ResultsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { AnalyzeResponse, Candidate } from "@/lib/types";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [usedMock, setUsedMock] = useState(false);

  async function handleAnalyze() {
    if (!files || files.length === 0) {
      setError("Select at least one PDF resume.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarnings([]);

    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as AnalyzeResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      setCandidates(payload.candidates ?? []);
      setWarnings(payload.warnings ?? []);
      setUsedMock(Boolean(payload.usedMock));
    } catch (analyzeError) {
      const message =
        analyzeError instanceof Error
          ? analyzeError.message
          : "Analysis failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          AI Resume Screener
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Parse PDF resumes, score them against a job description, and filter
          matches in real time.
        </p>
      </header>

      <ResumeUploader
        jobDescription={jobDescription}
        files={files}
        isLoading={isLoading}
        onJobDescriptionChange={setJobDescription}
        onFilesChange={setFiles}
        onAnalyze={handleAnalyze}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not analyze resumes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {usedMock ? (
        <Alert>
          <AlertTitle>Using mock scores</AlertTitle>
          <AlertDescription>
            OLLAMA_API_KEY is not set. PDFs are parsed, and match scores are
            generated locally from keyword overlap.
          </AlertDescription>
        </Alert>
      ) : null}

      {warnings.length > 0 ? (
        <Alert>
          <AlertTitle>Some files had issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Hide candidates below the threshold without calling the API again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="score-threshold">
              Minimum Match Score: {threshold}%
            </Label>
          </div>
          <Slider
            id="score-threshold"
            min={0}
            max={100}
            step={1}
            value={[threshold]}
            onValueChange={(value) => setThreshold(value[0] ?? 0)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Showing candidates at or above {threshold}% match.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsTable
            candidates={candidates}
            files={files}
            threshold={threshold}
          />
        </CardContent>
      </Card>
    </div>
  );
}
