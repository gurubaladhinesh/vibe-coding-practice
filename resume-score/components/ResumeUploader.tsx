"use client";

import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ResumeUploaderProps = {
  jobDescription: string;
  files: FileList | null;
  isLoading: boolean;
  onJobDescriptionChange: (value: string) => void;
  onFilesChange: (files: FileList | null) => void;
  onAnalyze: () => void;
};

export function ResumeUploader({
  jobDescription,
  files,
  isLoading,
  onJobDescriptionChange,
  onFilesChange,
  onAnalyze,
}: ResumeUploaderProps) {
  const fileCount = files?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input</CardTitle>
        <CardDescription>
          Paste a job description and upload one or more PDF resumes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="job-description">Job Description</Label>
          <Textarea
            id="job-description"
            value={jobDescription}
            onChange={(event) => onJobDescriptionChange(event.target.value)}
            placeholder="Describe the role, required skills, and experience..."
            className="min-h-40"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resumes">Upload Resumes</Label>
          <Input
            id="resumes"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={isLoading}
            onChange={(event) => onFilesChange(event.target.files)}
          />
          <p className="text-muted-foreground text-sm">
            {fileCount === 0
              ? "PDF files only. Multiple files are supported."
              : `${fileCount} PDF${fileCount === 1 ? "" : "s"} selected.`}
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isLoading || !jobDescription.trim() || fileCount === 0}
          onClick={onAnalyze}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FileUp />
          )}
          Analyze Resumes
        </Button>
      </CardContent>
    </Card>
  );
}
