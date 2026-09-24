import { auth0 } from "@/lib/auth0";
import { analyzeResumeWithGemini } from "@/lib/gemini";
import prisma from "@/lib/prisma";
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


    // 2. Veritabanındaki Kullanıcıyı Bulma
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database." }, { status: 404 });
    }

    
    // 3. FormData Alımı
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetJobTitle = (formData.get("targetJobTitle") as string) || "General Position";
    const jobDescription = (formData.get("jobDescription") as string) || "";


    // 4. Zod Validation
    const validationResult = resumeUploadSchema.safeParse({ file, targetJobTitle });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Invalid file data.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }


    // 5. Dosyayı Buffer'a Çevirme ve PDF Parsing
    const arrayBuffer = await file!.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    if (file!.type === "application/pdf") {
      extractedText = await parsePdfBuffer(buffer);
    } else {
      return NextResponse.json({ error: "Only PDF format is supported at the moment." }, { status: 400 });
    }


    // 6. Gemini AI ile CV Analizi
    const aiAnalysis = await analyzeResumeWithGemini(extractedText, targetJobTitle, jobDescription);
    
    // 7. MongoDB Atlas'a Kaydetme (ResumeAnalysis Modeli)
    const savedAnalysis = await prisma.resumeAnalysis.create({
      data: {
        userId: dbUser.id,
        jobTitle: targetJobTitle,
        jobDescription: jobDescription,
        resumeText: extractedText,
        matchScore: aiAnalysis.matchScore,
        feedback: aiAnalysis.feedback,
        missingSkills: aiAnalysis.missingSkills,
        strengths: aiAnalysis.strengths,
        suggestions: aiAnalysis.suggestions,
      },
    });

    return NextResponse.json({
      message: "Resume uploaded, analyzed with Gemini, and saved to database successfully.",
      data: savedAnalysis,
    });
  } catch (error: any) {
    console.error("CV Upload & AI Analysis API Error:", error);
    return NextResponse.json({ error: "An error occurred while processing or analyzing the file." }, { status: 500 });
  }
}