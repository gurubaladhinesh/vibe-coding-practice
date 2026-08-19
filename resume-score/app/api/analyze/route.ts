import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf";
import { hasOllamaKey, scoreResumeWithOllama } from "@/lib/score-resume";
import type { AnalyzeResponse, Candidate } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function analyzeFile(
  file: File,
  jobDescription: string,
): Promise<{ candidate: Candidate | null; warning?: string }> {
  const fileName = file.name || "resume.pdf";

  if (file.type && file.type !== "application/pdf") {
    return {
      candidate: null,
      warning: `${fileName} is not a PDF and was skipped.`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractPdfText(buffer);
    const candidate = await scoreResumeWithOllama(
      jobDescription,
      resumeText,
      fileName,
    );
    return { candidate };
  } catch (error) {
    const message = errorMessage(error);
    return {
      candidate: {
        name: fileName.replace(/\.pdf$/i, ""),
        email: "Not found",
        mobile: "Not found",
        score: 0,
        fileName,
        parseError: message,
      },
      warning: `Could not process ${fileName}: ${message}`,
    };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const jobDescription = String(formData.get("jobDescription") ?? "").trim();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Upload at least one PDF resume." },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      files.map((file) => analyzeFile(file, jobDescription)),
    );

    const candidates = results
      .map((result) => result.candidate)
      .filter((candidate): candidate is Candidate => candidate !== null);
    const warnings = results
      .map((result) => result.warning)
      .filter((warning): warning is string => Boolean(warning));

    const body: AnalyzeResponse = {
      candidates,
      usedMock: !hasOllamaKey(),
      warnings,
    };

    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to analyze resumes: ${errorMessage(error)}` },
      { status: 500 },
    );
  }
}
