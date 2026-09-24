import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return new Response("Unauthorized access. Please log in.", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Analizleri ve Mülakatları doğrudan kullanıcı ID'sine göre paralel çekiyoruz
    const [resumeAnalyses, interviewSessions] = await Promise.all([
      prisma.resumeAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.interviewSession.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return new Response(
      JSON.stringify({
        resumeAnalyses,
        interviewSessions,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}