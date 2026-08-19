# SkillMatch

Next.js App Router app that extracts text from PDF resumes, scores them against a job description with Ollama, and filters the results client-side.

## Setup

```bash
cd resume-score
npm install
cp .env.local.example .env.local
```

Set `OLLAMA_API_KEY` in `.env.local` for live scoring against Ollama Cloud (`https://ollama.com`). For a local Ollama daemon, set `OLLAMA_HOST=http://127.0.0.1:11434`. If the key is empty, PDFs are still parsed and scores are mocked from keyword overlap.

Set `NEXT_PUBLIC_MAX_RESUMES` to change how many PDFs can be uploaded in one run (default `10`).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Manual verification

1. Confirm the page is light-themed with the SkillMatch logo and title.
2. On a wide screen, inputs sit on the left and results on the right.
3. Paste a job description that mentions skills such as TypeScript and React.
4. Upload one or more PDF resumes (`accept=".pdf"` only).
5. Click **Analyze Resumes** and confirm skeleton rows appear, then fill in as each file finishes.
6. Confirm each row shows name, contact, score, matching/missing skills, comments, and a Download button.
7. Move **Minimum Match Score**. Rows below the threshold hide immediately with no extra API call.
8. Click **Download All** and confirm a `skillmatch-matches.zip` of visible PDFs.
9. Upload a non-text or corrupt PDF and confirm a warning plus a zero-score row instead of a crash.

## Automated checks

```bash
npm run verify:pdf
npm run test:analyze
```

`verify:pdf` writes a tiny fixture PDF and asserts that `pdf-parse` extracts name, email, and phone. `test:analyze` posts that PDF plus a sample job description to `POST /api/analyze` (requires the app to be running).

## API

`POST /api/analyze` accepts `FormData` with `jobDescription` and `files`. Each PDF is parsed, then scored with Ollama (`format: json`) including `matchingSkills`, `missingSkills`, and `comments`. The UI sends one file per request (up to 4 in parallel) so rows appear as they complete. Missing API keys fall back to mock scores.
