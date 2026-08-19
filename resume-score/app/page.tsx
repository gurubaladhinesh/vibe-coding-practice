"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ResumeUploader } from "@/components/ResumeUploader";
import { ResultsTable } from "@/components/ResultsTable";
import { SplitPane } from "@/components/SplitPane";
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
import { MAX_RESUMES } from "@/lib/config";
import {
  failedCandidate,
  type AnalyzeResponse,
  type Candidate,
} from "@/lib/types";

const ANALYZE_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      const item = items[current];
      if (item === undefined) {
        continue;
      }
      results[current] = await mapper(item);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [usedMock, setUsedMock] = useState(false);

  async function analyzeOne(
    file: File,
    description: string,
  ): Promise<{ candidate: Candidate; warnings: string[]; usedMock: boolean }> {
    const formData = new FormData();
    formData.append("jobDescription", description);
    formData.append("files", file);

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

      const candidate = payload.candidates?.[0];
      if (!candidate) {
        throw new Error("No candidate returned.");
      }

      return {
        candidate,
        warnings: payload.warnings ?? [],
        usedMock: Boolean(payload.usedMock),
      };
    } catch (analyzeError) {
      const message =
        analyzeError instanceof Error
          ? analyzeError.message
          : "Analysis failed.";
      return {
        candidate: failedCandidate(file.name, message),
        warnings: [`Could not process ${file.name}: ${message}`],
        usedMock: false,
      };
    }
  }

  async function handleAnalyze() {
    if (files.length === 0) {
      setError("Select at least one PDF resume.");
      return;
    }

    if (files.length > MAX_RESUMES) {
      setError(`You can upload at most ${MAX_RESUMES} resumes.`);
      return;
    }

    const selected = files.slice(0, MAX_RESUMES);
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    setCandidates([]);
    setPendingCount(selected.length);
    setUsedMock(false);

    try {
      await mapWithConcurrency(selected, ANALYZE_CONCURRENCY, async (file) => {
        const result = await analyzeOne(file, jobDescription);
        setCandidates((current) => [...current, result.candidate]);
        setWarnings((current) => [...current, ...result.warnings]);
        if (result.usedMock) {
          setUsedMock(true);
        }
        setPendingCount((count) => Math.max(0, count - 1));
        return result;
      });
    } finally {
      setIsLoading(false);
      setPendingCount(0);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-start gap-3">
        <BrandMark className="size-11 shrink-0" />
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">SkillMatch</h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
            See who actually fits the role. Score PDF resumes against a job
            description and filter matches as they come in.
          </p>
        </div>
      </header>

      <SplitPane
        left={
          <ResumeUploader
            jobDescription={jobDescription}
            files={files}
            isLoading={isLoading}
            maxResumes={MAX_RESUMES}
            onJobDescriptionChange={setJobDescription}
            onFilesChange={setFiles}
            onAnalyze={handleAnalyze}
          />
        }
        right={
          <div className="flex min-w-0 flex-col gap-4">
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

          <Card className="min-w-0 shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle>Filter</CardTitle>
              <CardDescription>
                Hide candidates below the threshold without calling the API
                again.
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

          <Card className="min-w-0 shadow-sm transition-shadow">
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
                pendingCount={pendingCount}
              />
            </CardContent>
          </Card>
          </div>
        }
      />
    </div>
  );
}
