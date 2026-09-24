import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// 1. Google Gemini Sağlayıcısı (Projenin .env içindeki GOOGLE_GENERATIVE_AI_API_KEY anahtarını kullanır)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// 2. AI'ın Döneceği Yanıtın Zod Şeması (Structured Output)
export const resumeAnalysisSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe("The percentage score indicating how well the CV matches the target job position"),
  feedback: z
    .string()
    .describe("General AI evaluation and summary of the CV"),
  missingSkills: z
    .array(z.string())
    .describe("The skills or qualifications that are missing in the CV compared to the target job position"),
  strengths: z
    .array(z.string())
    .describe("The strongest aspects and notable points in the user's CV"),
  suggestions: z
    .array(z.string())
    .describe("Concrete, step-by-step improvement suggestions to make the CV more effective"),
});

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisSchema>;

// 3. Gemini Analiz Fonksiyonu
export async function analyzeResumeWithGemini(
  resumeText: string,
  jobTitle: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const prompt = `
  Analyze the following CV text in relation to the target job position and its description. Provide a detailed evaluation, including a match score, feedback, missing skills, strengths, and actionable suggestions for improvement.

  TARGET JOB POSITION:
  ${jobTitle}

  JOB POSTING DESCRIPTION (If applicable):
  ${jobDescription || "Not specified. Analyze based on general position requirements."}

  CV TEXT:
  ${resumeText}

  Please evaluate from the perspective of an objective Human Resources (HR) manager and technical interviewer.
  `;

  // generateObject fonksiyonu, Gemini'nin yanıtı tam olarak Zod şemamıza uygun JSON formatında dönmesini zorunlu kılar.
  const { object } = await generateObject({
    model: google("gemini-3.6-flash"), // Hızlı ve ücretsiz kota dostu model
    schema: resumeAnalysisSchema,
    prompt: prompt,
    system:
    "You are an expert HR manager and technical interviewer. Provide a detailed and structured analysis of the CV in relation to the target job position.",
    maxRetries: 5, // Yoğunluk anında otomatik olarak 5 defaya kadar tekrar dener
  });

  return object;
}