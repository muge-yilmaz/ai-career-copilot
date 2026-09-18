const pdfParse = require("pdf-parse");

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    // PDF içerisindeki ham metni döndürüyoruz
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("PDF parsing failed. Please ensure the file is a valid PDF.");
  }
}