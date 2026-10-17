import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { syncUserWithDatabase } from "@/lib/user-sync";
import { ResumeUploadForm } from "./components/resume-upload-form";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  // Veritabanındaki kullanıcı kaydını çekiyoruz
  let dbUser = null;
  if (user?.sub && user?.email) {
    // 1. Önce veritabanını kontrol et
    dbUser = await prisma.user.findUnique({
      where: { auth0Id: user.sub },
    });

    // 2. Eğer Auth0 oturumu var ama veritabanında yoksa anında senkronize et
    if (!dbUser) {
      try {
        dbUser = await syncUserWithDatabase({
          sub: user.sub,
          email: user.email,
          name: user.name,
        });
      } catch (error) {
        console.error("Auto sync error on homepage:", error);
      }
    }
  }


 return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="container max-w-6xl mx-auto py-8 sm:py-10 px-4 space-y-6 sm:space-y-8">
        {/* Hero Banner Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-card text-xs font-medium text-primary shadow-sm max-w-full">
            <span className="truncate">✨ Powered by Gemini 3.6 & Next.js App Router</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-balance">
            Land Your Dream Job with{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Preparation
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Upload your resume, match it against job descriptions, and practice real-time technical interviews with our AI simulator.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/interview"
              className="px-4 py-2.5 bg-primary text-primary-foreground text-sm sm:text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all"
            >
              🚀 Try AI Interviewer
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 border bg-card text-card-foreground text-sm sm:text-xs font-semibold rounded-lg hover:bg-muted transition-all"
            >
              📊 View Dashboard
            </Link>
          </div>
        </div>

        {/* Dynamic User Profile Status Bar */}
        {user ? (
          <div className="p-4 border rounded-xl bg-card/80 backdrop-blur-sm shadow-sm flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col min-[420px]:flex-row sm:items-center gap-2 sm:gap-3 text-xs w-full sm:w-auto">
              <div className="px-4 py-2.5 bg-muted rounded-md flex items-center justify-center sm:justify-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-muted-foreground">MongoDB:</span>
                <span className="font-semibold text-foreground">
                  {dbUser ? "Synced" : "Connecting..."}
                </span>
              </div>

              <a
                href="/auth/logout"
                className="px-4 py-2.5 border rounded-md text-center text-destructive hover:bg-destructive/10 transition-colors"
              >
                Log Out
              </a>
            </div>
          </div>
        ) : (
          <div className="p-4 border rounded-xl bg-card text-center space-y-3 max-w-md mx-auto shadow-sm">
            <p className="text-xs text-muted-foreground">
              Please log in to start analyzing your CV and practicing interviews.
            </p>
            <a
              href="/auth/login"
              className="inline-block py-2 px-6 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90"
            >
              Log In / Sign Up
            </a>
          </div>
        )}

        {/* Feature Highlights & Resume Upload Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start pt-2 sm:pt-4">
          <div className="order-2 lg:order-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4 lg:col-span-1">
            <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2 h-full">
              <span className="text-xl">🎯</span>
              <h3 className="font-semibold text-sm">Keyword Match Score</h3>
              <p className="text-xs text-muted-foreground">
                Get an instant compatibility percentage between your CV and job postings.
              </p>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2 h-full">
              <span className="text-xl">🤖</span>
              <h3 className="font-semibold text-sm">Interactive AI Interviewer</h3>
              <p className="text-xs text-muted-foreground">
                Simulate role-specific questions and get real-time feedback with instant scoring.
              </p>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2 h-full">
              <span className="text-xl">📈</span>
              <h3 className="font-semibold text-sm">Performance Dashboard</h3>
              <p className="text-xs text-muted-foreground">
                Keep track of all your past CV match reports and completed interview transcripts.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-2 border rounded-2xl p-4 sm:p-6 bg-card shadow-md space-y-4">
            <div className="border-b pb-3">
              <h2 className="text-base font-bold">Resume Tailor & Match Analyzer</h2>
              <p className="text-xs text-muted-foreground">
                Upload your PDF resume below to see how well it fits your target role.
              </p>
            </div>

            {user ? (
              <ResumeUploadForm />
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl space-y-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  You need to be logged in to analyze your resume.
                </p>
                <a
                  href="/auth/login"
                  className="inline-block py-2 px-4 bg-primary text-primary-foreground text-xs font-medium rounded-md"
                >
                  Log In to Upload Resume
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}