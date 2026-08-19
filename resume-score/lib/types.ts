export type Candidate = {
  name: string;
  email: string;
  mobile: string;
  score: number;
  fileName: string;
  parseError?: string;
};

export type AnalyzeResponse = {
  candidates: Candidate[];
  usedMock: boolean;
  warnings: string[];
};
