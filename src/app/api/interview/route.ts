import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { interviewRequestSchema, type InterviewMessage } from "@/lib/validations/interview";
import { parseJsonBody } from "@/lib/validations/parse-json-body";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

const sessionIdPattern = /^[a-f\d]{24}$/i;

async function findOwnedSession(sessionId: string, userId: string) {
  return prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, roleTitle: true, messages: true, score: true },
  });
}

async function saveOwnedTranscript(sessionId: string, userId: string, transcript: InterviewMessage[]) {
  const owned = await findOwnedSession(sessionId, userId);
  if (!owned) return false;

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { messages: transcript },
  });
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return new Response("Unauthorized access. Please log in.", { status: 401 });
    }

    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId || !sessionIdPattern.test(sessionId)) {
      return Response.json({ error: "Invalid session id." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });
    if (!user) {
      return new Response("User not found in database.", { status: 404 });
    }

    const interview = await findOwnedSession(sessionId, user.id);
    if (!interview) {
      return Response.json({ error: "Interview session not found." }, { status: 404 });
    }
    if (interview.score !== null) {
      return Response.json({ error: "This interview is already complete." }, { status: 409 });
    }

    return Response.json({
      id: interview.id,
      roleTitle: interview.roleTitle,
      messages: interview.messages,
    });
  } catch (error) {
    console.error("Interview resume error:", error);
    return Response.json({ error: "Could not load this interview." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return new Response("Unauthorized access. Please log in.", { status: 401 });
    }


    //UPSTASH RATE LIMITING KONTROLÜ
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const identifier = session.user.sub || "anonymous_user";
      const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

      if (!success) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please wait a minute before trying again.",
            limit,
            remaining,
            reset,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }


    // Auth0 kullanıcısını veritabanından bul
    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return new Response("User not found in database.", { status: 404 });
    }

    const parsed = await parseJsonBody(req, interviewRequestSchema);
    if (!parsed.ok) return parsed.response;

    const { messages, roleTitle, sessionId, isFinished } = parsed.data;
    const position = roleTitle ?? "Software Engineer";

    // 1. Mülakat Bitti İşlemi (Save Session to DB)
    if (isFinished) {
      if (!sessionId) {
        return Response.json(
          { error: "A session id is required to save a finished interview." },
          { status: 400 },
        );
      }

      const saved = await saveOwnedTranscript(sessionId, user.id, messages);
      if (!saved) {
        return Response.json({ error: "Interview session not found." }, { status: 404 });
      }
      return new Response(JSON.stringify({ success: true, message: "Interview saved successfully." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Yeni Oturum Oluşturma (İlk İletide Oturum Yoksa)
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await prisma.interviewSession.create({
        data: {
          userId: user.id,
          roleTitle: position,
          messages: [],
        },
      });
      currentSessionId = newSession.id;
    }

    const systemPrompt = `
    You are an experienced, professional, and supportive Technical HR and Senior Engineer Interviewer conducting an interview for the "${position}" position.

    INTERVIEW RULES:
    1. Communicate with the candidate in English.
    2. Ask only ONE question at a time.
    3. Keep your responses brief and conversational.
    4. Briefly evaluate the candidate's answer and ask a relevant follow-up or new technical question.
    5. Start by briefly introducing yourself and asking the candidate to introduce themselves or answer a first question related to "${position}".
    `;

    const lastMessage = messages.at(-1);
    if (!lastMessage) {
      return Response.json({ error: "At least one message is required." }, { status: 400 });
    }

    // Geçmişi Google AI formatına eşleme
    const formattedHistory = messages.slice(0, -1).map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.content || "Hello" }],
    }));

    const lastContent = lastMessage.content;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessageStream(lastContent);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // İstemciye sessionId bilgisini ilk header/chunk olarak geçirebilmek için özel işaretçi
        controller.enqueue(encoder.encode(`[SESSION_ID:${currentSessionId}]`));

        for await (const chunk of result.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Interview API Error:", error);
    return new Response("An error occurred in the interview simulator.", { status: 500 });
  }
}