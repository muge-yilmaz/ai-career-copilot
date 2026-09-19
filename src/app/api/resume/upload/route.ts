import { auth0 } from "@/lib/auth0";
import { parsePdfBuffer } from "@/lib/resume-parser";
import { resumeUploadSchema } from "@/lib/validations/resume";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Oturum Kontrolü
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    // 2. FormData Alımı
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetJobTitle = (formData.get("targetJobTitle") as string) || undefined;

    // 3. Zod Validation
    const validationResult = resumeUploadSchema.safeParse({ file, targetJobTitle });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Invalid file data.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // 4. Dosyayı Buffer'a Çevirme ve PDF Parsing
    const arrayBuffer = await file!.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    if (file!.type === "application/pdf") {
      extractedText = await parsePdfBuffer(buffer);
    } else {
      return NextResponse.json({ error: "Only PDF format is supported at the moment." }, { status: 400 });
    }

    return NextResponse.json({
      message: "CV successfully uploaded and processed.",
      text: extractedText,
    });
  } catch (error: any) {
    console.error("CV Upload API Error:", error);
    return NextResponse.json({ error: "An error occurred while processing the file." }, { status: 500 });
  }
}