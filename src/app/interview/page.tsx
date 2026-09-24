import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import InterviewSimulator from "../components/interview-simulator";

export default async function InterviewPage() {
  const session = await auth0.getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-muted/20 to-background py-8 px-4">
      <div className="container max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-5"
            >
              ← Back to Home
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
              AI Technical Interview Simulator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Practice real-time technical & HR interview questions tailored to your target position.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-chart-3 text-xs font-semibold ">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              Live Gemini Stream
            </span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Side Info Cards */}
          <div className="space-y-4 lg:col-span-1">
            <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2">
              <span className="text-lg">💡</span>
              <h3 className="font-semibold text-xs text-foreground">How it Works</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Type your desired role (e.g. React Developer) and start chatting. The AI will evaluate your answers one question at a time.
              </p>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-xs text-foreground">Scoring & Feedback</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click **End Interview** when finished to receive an instant performance score along with strengths & improvement areas.
              </p>
            </div>
          </div>

          {/* Interactive Interview Component */}
          <div className="lg:col-span-2">
            <InterviewSimulator />
          </div>
        </div>
      </div>
    </div>
  );
}