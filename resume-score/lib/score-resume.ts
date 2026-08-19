import { Ollama } from "ollama";
import type { Candidate } from "@/lib/types";

const SYSTEM_PROMPT =
  "You are an expert HR recruiter. Extract the candidate's Name, Email, and Mobile. Then, compare the resume text against the provided Job Description. Assign a match score (0-100) based on skills and experience relevance.";

const DEFAULT_MODEL = "gpt-oss:120b";
const FALLBACK_MODELS = ["gemma4:31b", "nemotron-3-nano:30b"];

function clampScore(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function parseCandidateJson(raw: string, fileName: string): Candidate {
  const parsed = JSON.parse(extractJsonObject(raw)) as Partial<Candidate>;

  return {
    name: String(parsed.name ?? "Unknown").trim() || "Unknown",
    email: String(parsed.email ?? "").trim() || "Not found",
    mobile: String(parsed.mobile ?? "").trim() || "Not found",
    score: clampScore(parsed.score),
    fileName,
  };
}

function keywordScore(jobDescription: string, resumeText: string): number {
  const tokens = jobDescription
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((token) => token.length > 3);

  const unique = [...new Set(tokens)];
  if (unique.length === 0) {
    return 50;
  }

  const haystack = resumeText.toLowerCase();
  const hits = unique.filter((token) => haystack.includes(token)).length;
  return Math.round((hits / unique.length) * 100);
}

function extractField(text: string, pattern: RegExp, fallback: string): string {
  return text.match(pattern)?.[0] ?? fallback;
}

export function mockScoreResume(
  jobDescription: string,
  resumeText: string,
  fileName: string,
): Candidate {
  return {
    name: extractField(
      resumeText,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m,
      fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " "),
    ),
    email: extractField(
      resumeText,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      "Not found",
    ),
    mobile: extractField(
      resumeText,
      /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/,
      "Not found",
    ),
    score: keywordScore(jobDescription, resumeText),
    fileName,
  };
}

function createOllamaClient(apiKey: string): Ollama {
  const host = process.env.OLLAMA_HOST?.trim() || "https://ollama.com";

  return new Ollama({
    host,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

function modelCandidates(): string[] {
  const preferred = process.env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL;
  return [...new Set([preferred, ...FALLBACK_MODELS])];
}

export async function scoreResumeWithOllama(
  jobDescription: string,
  resumeText: string,
  fileName: string,
): Promise<Candidate> {
  const apiKey = process.env.OLLAMA_API_KEY?.trim();
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockScoreResume(jobDescription, resumeText, fileName);
  }

  const ollama = createOllamaClient(apiKey);
  const userPrompt = [
    "Return JSON with keys: name, email, mobile, score.",
    "score must be an integer from 0 to 100.",
    "If a contact field is missing, use an empty string.",
    "",
    "Job Description:",
    jobDescription,
    "",
    "Resume:",
    resumeText.slice(0, 12_000),
  ].join("\n");

  let lastError: unknown;

  for (const model of modelCandidates()) {
    try {
      const response = await ollama.chat({
        model,
        format: "json",
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });

      const content = response.message?.content;
      if (!content) {
        throw new Error(`Empty response from Ollama model ${model}.`);
      }

      return parseCandidateJson(content, fileName);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Ollama scoring failed.");
}

export function hasOllamaKey(): boolean {
  return Boolean(process.env.OLLAMA_API_KEY?.trim());
}
