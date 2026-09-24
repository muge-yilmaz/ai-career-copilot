import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

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

    const { messages, roleTitle, sessionId, isFinished } = await req.json();

    // 1. Mülakat Bitti İşlemi (Save Session to DB)
    if (isFinished && sessionId) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          messages: messages,
        },
      });
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
          roleTitle: roleTitle || "Software Engineer",
          messages: [],
        },
      });
      currentSessionId = newSession.id;
    }

    const systemPrompt = `
    You are an experienced, professional, and supportive Technical HR and Senior Engineer Interviewer conducting an interview for the "${roleTitle || "Software Engineer"}" position.

    INTERVIEW RULES:
    1. Communicate with the candidate in English.
    2. Ask only ONE question at a time.
    3. Keep your responses brief and conversational.
    4. Briefly evaluate the candidate's answer and ask a relevant follow-up or new technical question.
    5. Start by briefly introducing yourself and asking the candidate to introduce themselves or answer a first question related to "${roleTitle || "Software Engineer"}".
    `;

    // Geçmişi Google AI formatına eşleme
    const formattedHistory = (messages || []).slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "Hello" }],
    }));

    const lastMessage = messages[messages.length - 1];
    const lastContent = lastMessage?.content || "Hello";

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