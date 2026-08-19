# AI Resume Screener

Next.js App Router app that extracts text from PDF resumes, scores them against a job description with Ollama, and filters the results client-side.

## Setup

```bash
cd resume-score
npm install
cp .env.local.example .env.local
```

Set `OLLAMA_API_KEY` in `.env.local` for live scoring against Ollama Cloud (`https://ollama.com`). For a local Ollama daemon, set `OLLAMA_HOST=http://127.0.0.1:11434`. If the key is empty, PDFs are still parsed and scores are mocked from keyword overlap.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Manual verification

1. Paste a job description that mentions skills such as TypeScript and React.
2. Upload one or more PDF resumes (`accept=".pdf"` only).
3. Click **Analyze Resumes** and confirm the loading spinner appears.
4. Confirm the table shows name, email, mobile, score, and a Download button.
5. Move **Minimum Match Score**. Rows below the threshold hide immediately with no extra API call.
6. Upload a non-text or corrupt PDF and confirm a warning plus a zero-score row instead of a crash.

## Automated checks

```bash
npm run verify:pdf
npm run test:analyze
```

`verify:pdf` writes a tiny fixture PDF and asserts that `pdf-parse` extracts name, email, and phone. `test:analyze` posts that PDF plus a sample job description to `POST /api/analyze` (requires the app to be running).

## API

`POST /api/analyze` accepts `FormData` with `jobDescription` and `files`. Each PDF is parsed, then scored with Ollama (`format: json`). Missing API keys fall back to mock scores.
