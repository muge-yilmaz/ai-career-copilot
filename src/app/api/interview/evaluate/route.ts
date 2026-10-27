import { aiServiceErrorResponse } from "@/lib/ai-error";
import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { interviewEvaluationRequestSchema } from "@/lib/validations/interview";
import { parseJsonBody } from "@/lib/validations/parse-json-body";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, interviewEvaluationRequestSchema);
    if (!parsed.ok) return parsed.response;

    const { sessionId, messages, roleTitle } = parsed.data;
    const position = roleTitle ?? "Software Engineer";

    const prompt = `
    You are an expert HR and Technical Lead evaluating a candidate's completed interview for the position: "${position}".

    Here is the transcript of the interview:
    ${JSON.stringify(messages, null, 2)}

    Evaluate the candidate strictly and professionally.
    Return ONLY a valid JSON object matching this exact structure without markdown backticks or code blocks:

    {
      "overallScore": 85,
      "technicalScore": 80,
      "communicationScore": 90,
      "strengths": ["Strong understanding of full-stack concepts", "Good communication"],
      "improvements": ["Provide more specific code implementation details"],
      "feedback": "Overall great interview performance. Demonstrates solid experience with the tech stack."
    }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Markdown Backtick temizliği (eğer model ```json ... ``` dönerse)
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    const evaluation = JSON.parse(responseText);

    if (sessionId) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          score: Math.round(Number(evaluation.overallScore) || 0),
          feedback: JSON.stringify(evaluation),
        },
      });
    }

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Evaluation API Error:", error);
    return aiServiceErrorResponse(error, "The interview could not be evaluated. Please try again.");
  }
}