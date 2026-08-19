import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";

    if (!text) {
      throw new Error("No extractable text found in this PDF.");
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
