"use client";

import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";

export interface ResumeAnalysisItem {
  id: string;
  matchScore: number;
  jobTitle: string;
  missingSkills?: string[];
  feedback?: string;
  createdAt: string;
}

export interface InterviewSessionItem {
  id: string;
  roleTitle: string;
  score: number | null;
  feedback: string | null;
  messages: any;
  createdAt: string;
}

export interface DashboardData {
  resumeAnalyses: ResumeAnalysisItem[];
  interviewSessions: InterviewSessionItem[];
}

export const dashboardQueryKey = ["dashboard"] as const;

async function fetchDashboard(): Promise<DashboardData> {
  let res: Response;
  try {
    res = await fetch("/api/dashboard");
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    throw error;
  }

  if (!res.ok) {
    throw new Error("Dashboard fetch failed");
  }

  const data: Partial<DashboardData> = await res.json();
  return {
    resumeAnalyses: data.resumeAnalyses ?? [],
    interviewSessions: data.interviewSessions ?? [],
  };
}

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboard,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useDashboard() {
  return useQuery(dashboardQueryOptions());
}

export function invalidateDashboard(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
}
