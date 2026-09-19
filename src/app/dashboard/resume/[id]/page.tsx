import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ResumeAnalysisResult } from "@/app/components/resume-analysis-result";


interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumeDetailPage({ params }: PageProps) {
  const session = await auth0.getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Veritabanından analiz verisini çekiyoruz
  const analysis = await prisma.resumeAnalysis.findUnique({
    where: { id },
  });

  if (!analysis) {
    notFound();
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
        <span className="text-xs text-muted-foreground">
          {new Date(analysis.createdAt).toLocaleDateString("tr-TR")}
        </span>
      </div>

      <ResumeAnalysisResult
        data={{
          matchScore: analysis.matchScore,
          feedback: analysis.feedback,
          strengths: analysis.strengths,
          missingSkills: analysis.missingSkills,
          suggestions: analysis.suggestions,
          jobTitle: analysis.jobTitle,
        }}
      />
    </main>
  );
}