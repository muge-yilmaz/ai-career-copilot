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
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 space-y-6">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <InterviewSimulator />
    </main>
  );
}