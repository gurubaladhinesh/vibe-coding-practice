import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const JOB_DESCRIPTION = `
Senior TypeScript engineer for an internal hiring tool.
Required: TypeScript, React, Next.js, PDF processing, REST APIs.
Nice to have: OpenAI or Ollama integration, Tailwind CSS.
`.trim();

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  await run("node", [join(scriptDir, "verify-pdf-parse.mjs")]);

  const pdfPath = join(scriptDir, "fixtures", "sample-resume.pdf");
  const pdfBytes = await readFile(pdfPath);
  const form = new FormData();
  form.append("jobDescription", JOB_DESCRIPTION);
  form.append(
    "files",
    new File([pdfBytes], "sample-resume.pdf", { type: "application/pdf" }),
  );

  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: form,
  });

  const payload = await response.json();
  console.log("HTTP status:", response.status);
  console.log("Sample output:");
  console.log(JSON.stringify(payload, null, 2));

  if (!response.ok) {
    throw new Error(payload.error ?? "Analyze request failed.");
  }

  const candidate = payload.candidates?.[0];
  if (!candidate) {
    throw new Error("No candidates returned.");
  }

  if (typeof candidate.score !== "number") {
    throw new Error("Score was not a number.");
  }

  console.log("Analyze flow verification passed.");
}

main().catch((error) => {
  console.error("Analyze flow verification failed:", error);
  process.exitCode = 1;
});
