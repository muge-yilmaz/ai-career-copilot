import PDFParser from "pdf2json";

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error("PDF Parsing Error:", errData.parserError);
      reject(new Error("PDF parsing failed. The file might be corrupted or not a valid PDF."));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      // PDF içerisinden ayıklanan ham metni alıyoruz
      const rawText = pdfParser.getRawTextContent();
      resolve(rawText);
    });

    pdfParser.parseBuffer(buffer);
  });
}