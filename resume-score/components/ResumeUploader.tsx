"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_RESUMES } from "@/lib/config";

type ResumeUploaderProps = {
  jobDescription: string;
  files: File[];
  isLoading: boolean;
  maxResumes?: number;
  onJobDescriptionChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
};

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function ResumeUploader({
  jobDescription,
  files,
  isLoading,
  maxResumes = MAX_RESUMES,
  onJobDescriptionChange,
  onFilesChange,
  onAnalyze,
}: ResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [limitNote, setLimitNote] = useState<string | null>(null);
  const fileNames = files.map((file) => file.name);

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []).filter(isPdf);
    if (picked.length > maxResumes) {
      setLimitNote(`Only the first ${maxResumes} PDFs were kept.`);
    } else {
      setLimitNote(null);
    }
    onFilesChange(picked.slice(0, maxResumes));
    event.target.value = "";
  }

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>Screening inputs</CardTitle>
        <CardDescription>
          Paste a job description and upload PDF resumes.
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
            className="h-48 resize-none overflow-y-auto break-words"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resumes">Upload Resumes</Label>
          <input
            ref={fileInputRef}
            id="resumes"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={isLoading}
            className="sr-only"
            onChange={handleFilePick}
          />
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full cursor-pointer"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp />
            Choose Files
          </Button>
          <p className="text-muted-foreground text-sm">
            PDF only. Up to {maxResumes} resumes
            {fileNames.length > 0 ? ` · ${fileNames.length} selected` : ""}.
            {limitNote ? ` ${limitNote}` : ""}
          </p>
          {fileNames.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {fileNames.map((name) => (
                <li
                  key={name}
                  className="bg-secondary text-secondary-foreground max-w-full rounded-full px-2.5 py-0.5 text-xs break-all"
                >
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full cursor-pointer"
          disabled={isLoading || !jobDescription.trim() || fileNames.length === 0}
          onClick={onAnalyze}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <FileUp />}
          Analyze Resumes
        </Button>
      </CardContent>
    </Card>
  );
}
