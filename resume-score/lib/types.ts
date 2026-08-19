export type Candidate = {
  name: string;
  email: string;
  mobile: string;
  score: number;
  fileName: string;
  matchingSkills: string[];
  missingSkills: string[];
  comments: string;
  parseError?: string;
};

export type AnalyzeResponse = {
  candidates: Candidate[];
  usedMock: boolean;
  warnings: string[];
};

export function failedCandidate(fileName: string, message: string): Candidate {
  return {
    name: fileName.replace(/\.pdf$/i, ""),
    email: "Not found",
    mobile: "Not found",
    score: 0,
    fileName,
    matchingSkills: [],
    missingSkills: [],
    comments: "This resume could not be scored.",
    parseError: message,
  };
}
