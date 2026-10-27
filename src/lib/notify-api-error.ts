"use client";

import { toast } from "@/components/ui/toast";

export async function notifyApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const description =
    typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.";

  if (response.status === 429) {
    const resetAt =
      typeof data?.reset === "number"
        ? Math.max(0, Math.ceil((data.reset - Date.now()) / 1000))
        : null;

    toast.add({
      type: "warning",
      title: "Too many requests",
      description: resetAt
        ? `${description} Please try again in ${resetAt} seconds.`
        : description,
      timeout: 8000,
    });
    return description;
  }

  if (response.status === 503 || data?.code === "ai_unavailable") {
    toast.add({
      type: "error",
      title: "AI Service Unavailable",
      description,
      timeout: 8000,
    });
    return description;
  }

  toast.add({
    type: "error",
    title: response.status === 401 ? "Please log in" : "Request failed",
    description,
  });
  return description;
}