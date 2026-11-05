import { aiServiceErrorResponse } from "@/lib/ai-error";
import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { findOwnedSession, saveOwnedEvaluation } from "@/lib/interview-session";
import { interviewEvaluationRequestSchema } from "@/lib/validations/interview";
import { parseJsonBody } from "@/lib/validations/parse-json-body";
import { generateObject } from "ai";
import { google, interviewEvaluationSchema } from "@/lib/gemini";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/redis";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, interviewEvaluationRequestSchema);
    if (!parsed.ok) return parsed.response;

    const { sessionId, messages, roleTitle } = parsed.data;

    const user = await prisma.user.findUnique({ 
      where: { auth0Id: session.user.sub },
    });
    if (!user) {
      return Response.json({ error: "User not found in database." }, { status: 404 });
    }

    if (sessionId) {
      const owned = await findOwnedSession(sessionId, user.id);
      if (!owned) {
        return Response.json({ error: "Interview session not found." }, { status: 404 });
      }
    }
    const position = roleTitle ?? "Software Engineer";

    const prompt = `
    You are an expert HR and Technical Lead evaluating a candidate's completed interview for the position: "${position}".

    Here is the transcript of the interview:
    ${JSON.stringify(messages, null, 2)}

    Evaluate the candidate strictly and professionally.
    `;

    const rateLimitResponse = await enforceRateLimit(session.user.sub);
    if (rateLimitResponse) return rateLimitResponse;
    
    const { object: evaluation } = await generateObject({
      model: google("gemini-3.6-flash"),
      schema: interviewEvaluationSchema,
      system: "You are an expert HR and technical interviewer. Score the transcript strictly.",
      prompt,
      maxRetries: 5,
    });

    if (sessionId) {
      const saved = await saveOwnedEvaluation(sessionId, user.id, evaluation);
      if (!saved) {
        return Response.json({ error: "Interview session not found." }, { status: 404 });
      }
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