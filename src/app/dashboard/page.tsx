"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

interface ResumeAnalysisItem {
  id: string;
  matchPercentage: number;
  roleTitle: string;
  createdAt: string;
}

interface InterviewSessionItem {
  id: string;
  roleTitle: string;
  score: number | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [resumeAnalyses, setResumeAnalyses] = useState<ResumeAnalysisItem[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your past resume match analyses and AI interview performances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Past Interview Sessions */}
        <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-semibold text-base">Past AI Interviews</h2>
            <Link
              href="/interview"
              className="text-xs text-primary font-medium hover:underline"
            >
              + New Interview
            </Link>
          </div>

          {interviewSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No interview sessions recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {interviewSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <h3 className="text-xs font-semibold">{session.roleTitle}</h3>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-full">
                      {session.score !== null ? `${session.score}/100` : "Incomplete"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Resume Analyses */}
        <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-semibold text-base">Resume Analyses</h2>
            <Link
              href="/"
              className="text-xs text-primary font-medium hover:underline"
            >
              + Analyze Resume
            </Link>
          </div>

          {resumeAnalyses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No resume match analyses found.
            </p>
          ) : (
            <div className="space-y-3">
              {resumeAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <h3 className="text-xs font-semibold">
                      {analysis.roleTitle || "Target Role Analysis"}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 font-semibold rounded-full">
                    Match: {analysis.matchPercentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}