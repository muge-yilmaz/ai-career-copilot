import prisma from "@/lib/prisma";
import { InterviewMessage } from "@/lib/validations/interview"; 

export interface InterviewSession {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    strengths: string[];
    improvements: string[];
    feedback: string;
}

export async function findOwnedSession(sessionId: string, userId: string) {
    return prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, roleTitle: true, messages: true, score: true },
    });
  }
  
export async function saveOwnedTranscript(sessionId: string, userId: string, transcript: InterviewMessage[]) {
    const owned = await findOwnedSession(sessionId, userId);
    if (!owned) return false;
  
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { messages: transcript },
    });
    return true;
  }

  export async function saveOwnedEvaluation(
    sessionId: string,
    userId: string,
    evaluation: InterviewSession
  ) {
    const owned = await findOwnedSession(sessionId, userId);
    if (!owned) return false;

    await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
            score: Math.round(Number(evaluation.overallScore)),
            feedback: JSON.stringify(evaluation),
        }
    });
    return true;
  }

  