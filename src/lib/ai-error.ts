export function aiServiceErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  const unavailable =
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("503") ||
    message.includes("high demand");

  return Response.json(
    {
      error: unavailable
        ? "The AI service is busy or out of quota. Wait a moment and try again."
        : fallback,
      code: unavailable ? "ai_unavailable" : "request_failed",
    },
    { status: unavailable ? 503 : 500 },
  );
}
