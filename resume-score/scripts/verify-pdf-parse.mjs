import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const SAMPLE_PDF = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 88 >>
stream
BT /F1 12 Tf 72 720 Td (Jane Doe) Tj 0 -20 Td (jane.doe@example.com) Tj 0 -20 Td (+1 555 0100) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000405 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
482
%%EOF
`;

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = join(scriptDir, "fixtures", "sample-resume.pdf");
  await mkdir(dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, SAMPLE_PDF, "utf8");

  const parser = new PDFParse({ url: fixturePath });
  try {
    const result = await parser.getText();
    const text = result.text ?? "";

    console.log("Extracted text:");
    console.log(text);

    const required = ["Jane Doe", "jane.doe@example.com", "+1 555 0100"];
    const missing = required.filter((value) => !text.includes(value));

    if (missing.length > 0) {
      throw new Error(`Missing expected strings: ${missing.join(", ")}`);
    }

    console.log("PDF parsing verification passed.");
  } finally {
    await parser.destroy();
  }
}

main().catch((error) => {
  console.error("PDF parsing verification failed:", error);
  process.exitCode = 1;
});
