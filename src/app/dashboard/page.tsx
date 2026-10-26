"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


interface ResumeAnalysisItem {
  id: string;
  matchScore: number;
  jobTitle: string;
  missingSkills?: string[];
  feedback?: string;
  createdAt: string;
}

interface InterviewSessionItem {
  id: string;
  roleTitle: string;
  score: number | null;
  feedback: string | null;
  messages: any;
  createdAt: string;
}

export default function DashboardPage() {
  const [resumeAnalyses, setResumeAnalyses] = useState<ResumeAnalysisItem[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSessionItem | null>(null);


  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setResumeAnalyses(data.resumeAnalyses || []);
          setInterviewSessions(data.interviewSessions || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const validSessions = interviewSessions.filter((s) => s.score !== null);
  const avgScore =
    validSessions.length > 0
      ? Math.round(validSessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / validSessions.length)
      : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-muted/20 to-background py-6 sm:py-8 px-4 pb-10">
      <div className="container max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-4">
          <div>
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-5"
            >
              ← Back to Home
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">User Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Review your overall progress, past AI interview scores, and CV match history.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2">
            <Link
              href="/interview"
              className="px-3.5 py-2.5 text-center bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all sm:col-auto"
            >
              🎙️ New Interview
            </Link>
            <Link
              href="/"
              className="px-3.5 py-2.5 text-center border bg-card text-card-foreground text-xs font-semibold rounded-lg hover:bg-muted transition-all"
            >
              🎯 Analyze Resume
            </Link>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 border rounded-xl bg-card shadow-sm space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight">Total Interviews</span>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{interviewSessions.length}</p>
          </div>

          <div className="p-3 sm:p-4 border rounded-xl bg-card shadow-sm space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight">Total CV Matches</span>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{resumeAnalyses.length}</p>
          </div>

          <div className="p-3 sm:p-4 border rounded-xl bg-card shadow-sm space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight">Avg. Interview Score</span>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {avgScore !== null ? avgScore + "/100" : "N/A"}
            </p>
          </div>
        </div>

        {/* History Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Past AI Interviews */}
          <div className="border rounded-2xl p-4 sm:p-5 bg-card shadow-sm space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <span>🎙️</span> AI Interview Sessions
              </h2>
              <span className="text-xs px-3 py-1.5 bg-muted rounded-full text-muted-foreground font-medium">
                {interviewSessions.length} Recorded
              </span>
            </div>

            {interviewSessions.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl space-y-2 bg-muted/20">
                <p className="text-xs text-muted-foreground">No interview sessions recorded yet.</p>
                <Link
                  href="/interview"
                  className="inline-block text-xs text-primary font-semibold hover:underline"
                >
                  Start your first mock interview →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {interviewSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedInterview(session)}
                    className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center p-3.5 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {session.roleTitle}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between min-[420px]:justify-end gap-2 shrink-0">
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap ${
                          session.score && session.score >= 75
                            ? "bg-green-100 text-green-800"
                            : session.score && session.score >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {session.score !== null ? session.score + "/100" : "In Progress"}
                      </span>
                      {session.score === null && (
                        <Link
                          href={`/interview?sessionId=${session.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-xs px-3 py-1.5 rounded-full font-semibold bg-primary text-primary-foreground hover:opacity-90 whitespace-nowrap"
                        >
                          Continue
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Resume Analyses */}
          <div className="border rounded-2xl p-4 sm:p-5 bg-card shadow-sm space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <span>🎯</span> Resume Match Analyses
              </h2>
              <span className="text-xs px-3 py-1.5 bg-muted rounded-full text-muted-foreground font-medium">
                {resumeAnalyses.length} Analyzed
              </span>
            </div>

            {resumeAnalyses.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl space-y-2 bg-muted/20">
                <p className="text-xs text-muted-foreground">No resume analyses found.</p>
                <Link
                  href="/"
                  className="inline-block text-xs text-primary font-semibold hover:underline"
                >
                  Analyze your CV against job roles →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {resumeAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/dashboard/resume/${analysis.id}`}
                    className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center p-3.5 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-all shadow-2xs"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {analysis.jobTitle || "Target Role Analysis"}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between min-[420px]:justify-end gap-2 shrink-0">
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 font-bold rounded-full whitespace-nowrap">
                        {analysis.matchScore}% Match
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MÜLAKAT DETAY MODAL'I */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="w-full max-w-[calc(100%-1.5rem)] gap-4 p-4 sm:max-w-2xl sm:p-6 max-h-[min(85dvh,720px)] overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-base font-bold break-words">
              Interview Details: {selectedInterview?.roleTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transcript and AI evaluation generated on{" "}
              {selectedInterview && new Date(selectedInterview.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedInterview && (
            <div className="space-y-4 pt-2">
              {selectedInterview.score === null && (
                <Link
                  href={`/interview?sessionId=${selectedInterview.id}`}
                  className="inline-flex w-full items-center justify-center min-h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Continue interview
                </Link>
              )}

              {/* Değerlendirme Özeti */}
              {selectedInterview.score !== null && (
                <div className="p-4 border rounded-xl bg-primary/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary">Overall AI Score</span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 bg-primary text-primary-foreground rounded-full">
                      {selectedInterview.score}/100
                    </span>
                  </div>
                </div>
              )}

              {/* Sohbet Geçmişi */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Interview Transcript</h4>
                <div className="p-3 border rounded-xl bg-muted/20 space-y-3 max-h-[300px] overflow-y-auto">
                  {Array.isArray(selectedInterview.messages) ? (
                    selectedInterview.messages.map((m: any, idx: number) => (
                      <div key={idx} className="text-xs space-y-1">
                        <span className="font-bold text-primary">
                          {m.role === "user" ? "You" : "Interviewer"}:
                        </span>
                        <p className="text-muted-foreground leading-relaxed pl-2 border-l-2 border-muted break-words whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Transcript not available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    );
}